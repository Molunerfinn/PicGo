import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'

type ServerConfig = {
  port: number | string
  host: string
  enable: boolean
}

type HonoContextLike = {
  req: {
    raw: Request
    formData: () => Promise<FormData>
  }
  json: (data: unknown, status?: number) => Response
}

type UploadHandler = (c: HonoContextLike) => Promise<Response>

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const createJsonContext = (req: Request): HonoContextLike => {
  return {
    req: {
      raw: req,
      formData: async () => new FormData()
    },
    json: (data: unknown, status: number = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'content-type': 'application/json'
        }
      })
    }
  }
}

const readJson = async (res: Response): Promise<any> => {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

let serverConfig: ServerConfig | undefined
let registeredUploadHandler: UploadHandler | undefined
let formImageDir: string

const getConfigMock = vi.fn((key?: string) => {
  if (key === 'settings.server') return serverConfig
  return undefined
})

const saveConfigMock = vi.fn((patch: unknown) => {
  if (!isRecord(patch)) return
  const next = patch['settings.server']
  if (isRecord(next) && 'port' in next && 'host' in next && 'enable' in next) {
    serverConfig = next as unknown as ServerConfig
  }
})

const registerPostMock = vi.fn((routePath: string, handler: unknown, isInternal?: boolean) => {
  if (routePath === '/upload' && typeof handler === 'function') {
    registeredUploadHandler = handler as unknown as UploadHandler
  }
  return { routePath, isInternal }
})

const listenMock = vi.fn()
const shutdownMock = vi.fn()

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

const getAvailableWindowMock = vi.fn()
const uploadClipboardFilesMock = vi.fn()
const uploadSelectedFilesMock = vi.fn()

const dbPathDirMock = vi.fn(() => path.join(os.tmpdir(), 'picgo-gui-store'))
const getFormImageFolderPathMock = vi.fn(() => formImageDir)

const cleanupFormUploaderFilesMock = vi.fn((fileInfoList?: unknown) => {
  if (!Array.isArray(fileInfoList)) return
  for (const item of fileInfoList) {
    if (typeof item === 'string') {
      try {
        fs.removeSync(item)
      } catch {
        // ignore
      }
    }
  }
})

vi.mock('@core/picgo', () => {
  return {
    default: {
      getConfig: getConfigMock,
      saveConfig: saveConfigMock,
      server: {
        registerPost: registerPostMock,
        listen: listenMock,
        shutdown: shutdownMock
      }
    }
  }
})

vi.mock('@core/picgo/logger', () => {
  return { default: loggerMock }
})

vi.mock('apis/app/window/windowManager', () => {
  return {
    default: {
      getAvailableWindow: getAvailableWindowMock
    }
  }
})

vi.mock('apis/app/uploader/apis', () => {
  return {
    uploadClipboardFiles: uploadClipboardFilesMock,
    uploadSelectedFiles: uploadSelectedFilesMock
  }
})

vi.mock('apis/core/datastore/dbChecker', () => {
  return {
    dbPathDir: dbPathDirMock,
    getFormImageFolderPath: getFormImageFolderPathMock
  }
})

vi.mock('~/main/utils/cleanupFormUploaderFiles', () => {
  return {
    cleanupFormUploaderFiles: cleanupFormUploaderFilesMock
  }
})

describe('main/server (GUI adapter to picgo-core)', () => {
  beforeEach(async () => {
    serverConfig = undefined
    registeredUploadHandler = undefined
    formImageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'picgo-gui-form-'))

    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(async () => {
    await fs.remove(formImageDir)
  })

  it('backfills default settings.server when missing', async () => {
    serverConfig = undefined

    await import('../../main/server')

    expect(saveConfigMock).toHaveBeenCalledWith({
      'settings.server': {
        port: 36677,
        host: '127.0.0.1',
        enable: true
      }
    })
    expect(serverConfig).toEqual({
      port: 36677,
      host: '127.0.0.1',
      enable: true
    })
  })

  it('does not listen when settings.server.enable is false', async () => {
    serverConfig = { port: 36677, host: '127.0.0.1', enable: false }
    const mod = await import('../../main/server')
    const server = mod.default

    server.startup()

    expect(registerPostMock).not.toHaveBeenCalled()
    expect(listenMock).not.toHaveBeenCalled()
  })

  it('registers internal /upload override and delegates listen/shutdown to picgo.server', async () => {
    serverConfig = { port: '36677', host: '127.0.0.1', enable: true }
    listenMock.mockResolvedValue(36677)

    const mod = await import('../../main/server')
    const server = mod.default

    server.startup()

    expect(registerPostMock).toHaveBeenCalledTimes(1)
    expect(registerPostMock).toHaveBeenCalledWith('/upload', expect.any(Function), true)
    expect(listenMock).toHaveBeenCalledWith(36677, '127.0.0.1')

    server.shutdown()
    expect(shutdownMock).toHaveBeenCalledTimes(1)
  })

  it('implements GUI-compatible /upload JSON semantics with core-style status codes', async () => {
    serverConfig = { port: 36677, host: '127.0.0.1', enable: true }
    uploadClipboardFilesMock.mockResolvedValue('https://a.example/clipboard.png')
    uploadSelectedFilesMock.mockResolvedValue(['https://a.example/a.png'])
    getAvailableWindowMock.mockReturnValue({ webContents: {} })

    const mod = await import('../../main/server')
    const server = mod.default
    server.startup()

    expect(registeredUploadHandler).toBeDefined()
    const handler = registeredUploadHandler!

    const resEmpty = await handler(createJsonContext(new Request('http://127.0.0.1/upload', { method: 'POST' })))
    expect(resEmpty.status).toBe(200)
    expect(await readJson(resEmpty)).toEqual({ success: true, result: ['https://a.example/clipboard.png'] })

    const resObj = await handler(createJsonContext(new Request('http://127.0.0.1/upload', { method: 'POST', body: '{}' })))
    expect(resObj.status).toBe(200)
    expect(await readJson(resObj)).toEqual({ success: true, result: ['https://a.example/clipboard.png'] })

    const resEmptyList = await handler(createJsonContext(new Request('http://127.0.0.1/upload', {
      method: 'POST',
      body: JSON.stringify({ list: [] })
    })))
    expect(resEmptyList.status).toBe(200)
    expect(await readJson(resEmptyList)).toEqual({ success: true, result: ['https://a.example/clipboard.png'] })

    const resList = await handler(createJsonContext(new Request('http://127.0.0.1/upload', {
      method: 'POST',
      body: JSON.stringify({ list: ['/a.png'] })
    })))
    expect(resList.status).toBe(200)
    expect(await readJson(resList)).toEqual({ success: true, result: ['https://a.example/a.png'] })

    const resInvalid = await handler(createJsonContext(new Request('http://127.0.0.1/upload', { method: 'POST', body: '{' })))
    expect(resInvalid.status).toBe(400)
    expect(await readJson(resInvalid)).toMatchObject({ success: false })
  })

  it('writes multipart files to fixed temp folder and always cleans up (success/failure)', async () => {
    serverConfig = { port: 36677, host: '127.0.0.1', enable: true }
    getAvailableWindowMock.mockReturnValue({ webContents: {} })

    const mod = await import('../../main/server')
    const server = mod.default
    server.startup()

    const handler = registeredUploadHandler!

    const makeMultipartContext = async (): Promise<{ ctx: HonoContextLike; expectedPath: string }> => {
      const fd = new FormData()
      fd.append('files', new Blob([Buffer.from('hello')], { type: 'image/png' }), 'a.png')

      const req = new Request('http://127.0.0.1/upload', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        }
      })
      const expectedPath = path.join(formImageDir, 'a.png')
      return {
        ctx: {
          req: {
            raw: req,
            formData: async () => fd
          },
          json: (data: unknown, status: number = 200) => new Response(JSON.stringify(data), { status })
        },
        expectedPath
      }
    }

    // success case
    uploadSelectedFilesMock.mockImplementation(async (_webContents: unknown, list: Array<{ path: string }>) => {
      for (const item of list) {
        expect(await fs.pathExists(item.path)).toBe(true)
      }
      return ['https://a.example/form.png']
    })

    const { ctx: ctxSuccess, expectedPath: pathSuccess } = await makeMultipartContext()
    const resSuccess = await handler(ctxSuccess)
    expect(resSuccess.status).toBe(200)
    expect(await readJson(resSuccess)).toEqual({ success: true, result: ['https://a.example/form.png'] })
    expect(await fs.pathExists(pathSuccess)).toBe(false)

    // failure case still cleans up
    uploadSelectedFilesMock.mockRejectedValueOnce(new Error('fail'))

    const { ctx: ctxFail, expectedPath: pathFail } = await makeMultipartContext()
    const resFail = await handler(ctxFail)
    expect(resFail.status).toBe(500)
    expect(await readJson(resFail)).toMatchObject({ success: false })
    expect(await fs.pathExists(pathFail)).toBe(false)
  })
})

