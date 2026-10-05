import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer } from 'node:net'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { IImgInfo, IPicGo, IPlugin, IUploaderConfigItem, PicGo } from 'picgo'

interface TestProfile extends IUploaderConfigItem {
  endpoint: string
}

interface UploadCapture {
  uploader: string
  endpoint: string
  origins: string[]
}

interface UploadResponse {
  success: boolean
  result: string[]
  items: Array<{
    imgUrl?: string
    fileName?: string
    origin?: string
    type?: string
  }>
  code?: string
  message?: string
}

type GuiServer = {
  startup: () => void
  shutdown: () => void
}

const testState = vi.hoisted(() => ({
  configPath: '',
  formImagePath: ''
}))

const mocks = vi.hoisted(() => {
  const availableWebContents = {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }
  const trayWebContents = {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }
  const settingWebContents = {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }

  return {
    availableWebContents,
    trayWebContents,
    settingWebContents,
    albumInsertMock: vi.fn(),
    handleCopyUrlMock: vi.fn(),
    showNotificationMock: vi.fn(),
    reportUploadDataMock: vi.fn(async () => {}),
    privacyCheckMock: vi.fn(async () => true),
    getClipboardFilePathListMock: vi.fn((): string[] => []),
    clipboardReadImageMock: vi.fn(() => ({
      isEmpty: () => false,
      toPNG: () => Buffer.from('builtin clipboard image')
    })),
    ipcMainOnMock: vi.fn(),
    ipcMainOnceMock: vi.fn(),
    ipcMainRemoveListenerMock: vi.fn()
  }
})

vi.mock('apis/core/datastore/dbChecker', () => ({
  dbChecker: () => {},
  dbPathChecker: () => testState.configPath,
  getFormImageFolderPath: () => testState.formImagePath
}))

vi.mock('electron', () => ({
  BrowserWindow: class {},
  clipboard: {
    readImage: mocks.clipboardReadImageMock
  },
  ipcMain: {
    on: mocks.ipcMainOnMock,
    once: mocks.ipcMainOnceMock,
    removeListener: mocks.ipcMainRemoveListenerMock
  },
  shell: {
    openExternal: vi.fn(async () => {})
  }
}))

vi.mock('apis/app/window/windowManager', () => ({
  default: {
    getAvailableWindow: () => ({ webContents: mocks.availableWebContents }),
    get: (name: string) => {
      if (name === 'TRAY_WINDOW') return { webContents: mocks.trayWebContents }
      if (name === 'SETTING_WINDOW') return { webContents: mocks.settingWebContents }
      return undefined
    },
    has: (name: string) => name === 'SETTING_WINDOW',
    create: vi.fn(),
    deleteById: vi.fn()
  }
}))

vi.mock('~/main/apis/core/datastore', () => ({
  AlbumDB: {
    getInstance: () => ({
      insert: mocks.albumInsertMock
    })
  }
}))

vi.mock('~/main/utils/common', () => ({
  getClipboardFilePathList: mocks.getClipboardFilePathListMock,
  handleCopyUrl: mocks.handleCopyUrlMock,
  handleUrlEncodeWithSetting: (url: string) => url,
  showNotification: mocks.showNotificationMock
}))

vi.mock('~/main/utils/privacyManager', () => ({
  privacyManager: {
    check: mocks.privacyCheckMock
  }
}))

vi.mock('~/main/utils/dataReport', () => ({
  dataReportManager: {
    reportUploadData: mocks.reportUploadDataMock
  }
}))

vi.mock('~/main/i18n', () => ({
  T: (key: string) => key
}))

vi.mock('~/main/i18n/index', () => ({
  T: (key: string) => key
}))

const reservePort = async (): Promise<number> => {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') {
    server.close()
    throw new Error('Failed to reserve an integration-test port')
  }
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
  return address.port
}

const waitForServer = async (baseUrl: string): Promise<void> => {
  let lastError: unknown
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/heartbeat`, { method: 'POST' })
      if (response.ok) return
    } catch (error: unknown) {
      lastError = error
    }
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw lastError instanceof Error ? lastError : new Error('GUI server did not start')
}

const makeProfile = (id: string, name: string, endpoint: string): TestProfile => ({
  _id: id,
  _configName: name,
  _createdAt: 1,
  _updatedAt: 1,
  endpoint
})

const parseUploadResponse = async (response: Response): Promise<UploadResponse> => {
  return await response.json() as UploadResponse
}

describe('GUI server upload options integration', () => {
  const uploaderA = 'integration-uploader-a'
  const uploaderB = 'integration-uploader-b'
  const transformer = 'integration-transformer'
  const defaultA = makeProfile('a-default-id', 'Default A', 'a-default')
  const namedA = makeProfile('a-named-id', 'Named A', 'a-named')
  const defaultB = makeProfile('b-default-id', 'Default B', 'b-default')
  const selectedB = makeProfile('b-selected-id', 'Selected B', 'b-selected')
  const uploadCaptures: UploadCapture[] = []
  let tempPath = ''
  let jsonImagePath = ''
  let configFileBeforeUploads = ''
  let rootConfigBeforeUploads: unknown
  let baseUrl = ''
  let picgo: PicGo
  let guiServer: GuiServer

  const expectConfigUnchanged = async () => {
    expect(structuredClone(picgo.getConfig())).toEqual(rootConfigBeforeUploads)
    await expect(readFile(testState.configPath, 'utf8')).resolves.toBe(configFileBeforeUploads)
  }

  const integrationTransformer: IPlugin = {
    handle: async (ctx: IPicGo) => {
      ctx.output = await Promise.all(ctx.input.map(async (input): Promise<IImgInfo> => {
        if (typeof input !== 'string') return { ...input }
        const buffer = await readFile(input)
        return {
          buffer,
          contentType: 'image/png',
          extname: path.extname(input) || '.png',
          fileName: path.basename(input),
          filePath: input,
          origin: input,
          size: buffer.byteLength
        }
      }))
    }
  }

  const integrationUploader: IPlugin = {
    handle: (ctx: IPicGo) => {
      const uploader = ctx.getConfig<string>('picBed.uploader')
      const profile = ctx.getConfig<TestProfile>(`picBed.${uploader}`)
      uploadCaptures.push({
        uploader,
        endpoint: profile.endpoint,
        origins: ctx.output.map(item => item.origin ?? '')
      })
      ctx.output = ctx.output.map(item => ({
        ...item,
        imgUrl: `https://uploads.test/${profile.endpoint}/${item.fileName}`
      }))
    }
  }

  beforeAll(async () => {
    tempPath = await mkdtemp(path.join(tmpdir(), 'picgo-gui-server-options-'))
    testState.configPath = path.join(tempPath, 'config.json')
    testState.formImagePath = path.join(tempPath, 'picgo-form-images')
    jsonImagePath = path.join(tempPath, 'json image.png')
    await mkdir(path.join(tempPath, 'picgo-clipboard-images'), { recursive: true })
    await writeFile(testState.configPath, '{}')
    await writeFile(jsonImagePath, 'json image')

    const port = await reservePort()
    baseUrl = `http://127.0.0.1:${port}`

    picgo = (await import('@core/picgo')).default
    picgo.helper.transformer.register(transformer, integrationTransformer)
    picgo.helper.uploader.register(uploaderA, integrationUploader)
    picgo.helper.uploader.register(uploaderB, integrationUploader)
    picgo.saveConfig({
      'picBed.current': uploaderA,
      'picBed.uploader': uploaderA,
      'picBed.transformer': transformer,
      [`picBed.${uploaderA}`]: defaultA,
      [`picBed.${uploaderB}`]: defaultB,
      [`uploader.${uploaderA}`]: {
        configList: [defaultA, namedA],
        defaultId: defaultA._id
      },
      [`uploader.${uploaderB}`]: {
        configList: [defaultB, selectedB],
        defaultId: defaultB._id
      },
      'settings.server': {
        enable: true,
        host: '127.0.0.1',
        port
      },
      'settings.useBuiltinClipboard': true,
      'settings.pasteStyle': 'URL',
      'settings.customLink': '$url',
      'settings.rename': false,
      'settings.autoRename': false,
      'settings.uploadNotification': false
    })

    guiServer = (await import('../../main/server')).default
    guiServer.startup()
    await waitForServer(baseUrl)

    rootConfigBeforeUploads = structuredClone(picgo.getConfig())
    configFileBeforeUploads = await readFile(testState.configPath, 'utf8')
  })

  beforeEach(() => {
    uploadCaptures.length = 0
    mocks.albumInsertMock.mockClear()
    mocks.handleCopyUrlMock.mockClear()
    mocks.showNotificationMock.mockClear()
  })

  afterAll(async () => {
    guiServer?.shutdown()
    if (tempPath !== '') {
      await rm(tempPath, { recursive: true, force: true })
    }
  })

  it('selects a named profile for a JSON path upload and keeps raw GUI results', async () => {
    const query = new URLSearchParams({ uploader: uploaderA, configName: namedA._configName })
    const response = await fetch(`${baseUrl}/upload?${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)
    const expectedUrl = `https://uploads.test/${namedA.endpoint}/json image.png`

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.result).toEqual([expectedUrl])
    expect(body.items[0]).toMatchObject({ imgUrl: expectedUrl, type: uploaderA })
    expect(uploadCaptures).toEqual([{ uploader: uploaderA, endpoint: namedA.endpoint, origins: [jsonImagePath] }])
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: expectedUrl, type: uploaderA }))
    await expectConfigUnchanged()
  })

  it('selects a profile by ID for a multipart upload', async () => {
    const formData = new FormData()
    formData.append('files', new Blob(['multipart image'], { type: 'image/png' }), 'multipart image.png')
    const response = await fetch(`${baseUrl}/upload?configId=${selectedB._id}`, {
      method: 'POST',
      body: formData
    })
    const body = await parseUploadResponse(response)
    const expectedUrl = `https://uploads.test/${selectedB.endpoint}/multipart image.png`

    expect(response.status).toBe(200)
    expect(body.result).toEqual([expectedUrl])
    expect(body.items[0]).toMatchObject({ imgUrl: expectedUrl, fileName: 'multipart image.png', type: uploaderB })
    expect(uploadCaptures[0]).toMatchObject({ uploader: uploaderB, endpoint: selectedB.endpoint })
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: expectedUrl, type: uploaderB }))
    await expectConfigUnchanged()
  })

  it('uses configName fallback after a missing ID on the builtin clipboard path', async () => {
    const query = new URLSearchParams({
      uploader: uploaderA,
      configId: 'missing-id',
      configName: defaultA._configName
    })
    const response = await fetch(`${baseUrl}/upload?${query}`, { method: 'POST' })
    const body = await parseUploadResponse(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.result[0]).toMatch(new RegExp(`^https://uploads\\.test/${defaultA.endpoint}/\\d+\\.png$`))
    expect(uploadCaptures[0]).toMatchObject({ uploader: uploaderA, endpoint: defaultA.endpoint })
    expect(mocks.clipboardReadImageMock).toHaveBeenCalled()
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: body.result[0], type: uploaderA }))
    await expectConfigUnchanged()
  })

  it('retains the root default when no upload options are supplied', async () => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)
    const expectedUrl = `https://uploads.test/${defaultA.endpoint}/json image.png`

    expect(response.status).toBe(200)
    expect(body.result).toEqual([expectedUrl])
    expect(uploadCaptures).toEqual([{ uploader: uploaderA, endpoint: defaultA.endpoint, origins: [jsonImagePath] }])
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: expectedUrl, type: uploaderA }))
    await expectConfigUnchanged()
  })

  it('rejects invalid options before invoking the GUI upload adapter', async () => {
    const response = await fetch(`${baseUrl}/upload?uploader=missing-uploader`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ success: false, code: 'UNKNOWN_UPLOADER', result: [], items: [] })
    expect(uploadCaptures).toEqual([])
    expect(mocks.albumInsertMock).not.toHaveBeenCalled()
    await expectConfigUnchanged()
  })
})
