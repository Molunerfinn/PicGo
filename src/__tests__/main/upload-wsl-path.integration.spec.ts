import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PicGo } from 'picgo'
import type { IPicGo } from 'picgo'
import { normalizeWslPath } from '~/main/utils/normalizeWslPath'

/**
 * Windows integration coverage for https://github.com/Molunerfinn/PicGo/issues/1439.
 * A local WSL distribution is required because the test reads through the real
 * Windows UNC share before passing the file through PicGo core.
 */

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)
const RELATIVE_DIR_NAME = 'picgo-integration-test'
const FILE_NAME = 'integration-upload.png'

const findWslDistro = (): string | undefined => {
  if (process.platform !== 'win32') return undefined
  try {
    const output = execFileSync('wsl.exe', ['--list', '--quiet'], { encoding: 'utf8' })
    const distros = output
      .replaceAll('\0', '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
    return distros[0] ?? undefined
  } catch {
    return undefined
  }
}

const wslDistro = findWslDistro()

const runInWsl = (distro: string, command: string): string => {
  return execFileSync('wsl.exe', ['-d', distro, '--', 'bash', '-lc', command], { encoding: 'utf8' }).trim()
}

describe.skipIf(!wslDistro)('WSL network-share path upload (issue #1439)', () => {
  let configDir = ''
  let relativeWslPath = ''
  let uncDirPath = ''
  let uncFilePath = ''
  const received: Array<{ fileName?: string, filePath?: string, buffer?: Buffer }> = []

  beforeAll(() => {
    const distro = wslDistro
    if (distro === undefined) return

    configDir = mkdtempSync(join(tmpdir(), 'picgo-wsl-integration-'))
    const linuxHome = runInWsl(distro, 'printf %s "$HOME"')
    const relativeHome = linuxHome.slice(1).replaceAll('/', '\\')
    const wslRoot = `\\\\wsl$\\${distro}`
    uncDirPath = `${wslRoot}\\${relativeHome}\\${RELATIVE_DIR_NAME}`
    uncFilePath = `${uncDirPath}\\${FILE_NAME}`
    relativeWslPath = `wsl$\\${distro}\\${relativeHome}\\${RELATIVE_DIR_NAME}\\${FILE_NAME}`

    mkdirSync(uncDirPath, { recursive: true })
    writeFileSync(uncFilePath, PNG_BYTES)

    expect(existsSync(uncFilePath)).toBe(true)
    expect(existsSync(relativeWslPath)).toBe(false)
  }, 60000)

  afterAll(async () => {
    // PicGo core debounces log writes, so cleanup must wait until its writers settle.
    await new Promise(resolve => setTimeout(resolve, 500))
    if (uncDirPath !== '') rmSync(uncDirPath, { recursive: true, force: true })
    if (configDir !== '') rmSync(configDir, { recursive: true, force: true })
  }, 60000)

  beforeEach(() => {
    received.length = 0
  })

  const createPicGo = (): PicGo => {
    const picgo = new PicGo(join(configDir, 'config.json'))
    picgo.saveConfig({ 'picBed.uploader': 'stub', debug: false })
    picgo.helper.uploader.register('stub', {
      name: 'Stub',
      handle: async (ctx: IPicGo) => {
        for (const item of ctx.output) {
          item.imgUrl = `https://integration.example/${item.fileName ?? FILE_NAME}`
          received.push({ fileName: item.fileName, filePath: item.filePath, buffer: item.buffer })
        }
      }
    })
    return picgo
  }

  it('rejects the Typora-style relative path without normalization', async () => {
    const picgo = createPicGo()

    const result = await picgo.upload([relativeWslPath])

    expect(result).toEqual([])
    expect(received).toHaveLength(0)
  }, 60000)

  it('uploads the file after converting the path to a readable UNC path', async () => {
    const picgo = createPicGo()

    const normalizedPath = normalizeWslPath(relativeWslPath)
    expect(normalizedPath).toBe(uncFilePath)

    const result = await picgo.upload([normalizedPath])

    expect(received).toHaveLength(1)
    expect(received[0].fileName).toBe(FILE_NAME)
    expect(received[0].buffer?.equals(PNG_BYTES)).toBe(true)
    expect(result).toEqual([
      expect.objectContaining({
        imgUrl: `https://integration.example/${FILE_NAME}`
      })
    ])
  }, 60000)
})
