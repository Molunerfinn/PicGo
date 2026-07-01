import { beforeEach, describe, expect, it, vi } from 'vitest'

type ServerConfig = {
  port: number | string
  host: string
  enable: boolean
}

type ServerUploadAdapter = {
  uploadClipboard: () => Promise<ImgInfo[] | Error>
  uploadPaths: (paths: string[]) => Promise<ImgInfo[] | Error>
  getTempDir: () => string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

let serverConfig: ServerConfig | undefined
let installedUploadAdapter: ServerUploadAdapter | undefined

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

const setUploadAdapterMock = vi.fn((adapter?: ServerUploadAdapter) => {
  installedUploadAdapter = adapter
})
const registerPostMock = vi.fn()
const listenMock = vi.fn()
const shutdownMock = vi.fn()

const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

const getAvailableWindowMock = vi.fn()
const uploadClipboardFilesWithInfoMock = vi.fn()
const uploadSelectedFilesWithInfoMock = vi.fn()
const getFormImageFolderPathMock = vi.fn(() => '/tmp/picgo-form-images')

vi.mock('@core/picgo', () => {
  return {
    default: {
      getConfig: getConfigMock,
      saveConfig: saveConfigMock,
      server: {
        setUploadAdapter: setUploadAdapterMock,
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
    uploadClipboardFilesWithInfo: uploadClipboardFilesWithInfoMock,
    uploadSelectedFilesWithInfo: uploadSelectedFilesWithInfoMock
  }
})

vi.mock('apis/core/datastore/dbChecker', () => {
  return {
    getFormImageFolderPath: getFormImageFolderPathMock
  }
})

describe('main/server (GUI adapter to picgo-core)', () => {
  beforeEach(() => {
    serverConfig = undefined
    installedUploadAdapter = undefined

    vi.clearAllMocks()
    vi.resetModules()
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

  it('does not install upload adapter or listen when settings.server.enable is false', async () => {
    serverConfig = { port: 36677, host: '127.0.0.1', enable: false }
    const mod = await import('../../main/server')
    const server = mod.default

    server.startup()

    expect(setUploadAdapterMock).not.toHaveBeenCalled()
    expect(registerPostMock).not.toHaveBeenCalled()
    expect(listenMock).not.toHaveBeenCalled()
  })

  it('installs GUI upload adapter once and delegates listen/shutdown to picgo.server', async () => {
    serverConfig = { port: '36677', host: '127.0.0.1', enable: true }
    listenMock.mockResolvedValue(36677)

    const mod = await import('../../main/server')
    const server = mod.default

    server.startup()
    server.startup()

    expect(setUploadAdapterMock).toHaveBeenCalledTimes(1)
    expect(registerPostMock).not.toHaveBeenCalled()
    expect(listenMock).toHaveBeenCalledTimes(2)
    expect(listenMock).toHaveBeenCalledWith(36677, '127.0.0.1')
    expect(installedUploadAdapter).toBeDefined()

    server.shutdown()
    expect(shutdownMock).toHaveBeenCalledTimes(1)
  })

  it('GUI upload adapter preserves side-effect upload helpers and returns raw ImgInfo[] for Core responses', async () => {
    serverConfig = { port: 36677, host: '127.0.0.1', enable: true }
    const webContents = { send: vi.fn() }
    const clipboardImage: ImgInfo = {
      imgUrl: 'https://raw.example/clipboard image.png',
      fileName: 'clipboard image.png',
      extname: '.png',
      size: 123
    }
    const selectedImages: ImgInfo[] = [{
      imgUrl: 'https://raw.example/a image.png',
      fileName: 'a image.png',
      extname: '.png',
      origin: '/tmp/a.png',
      width: 10
    }]
    getAvailableWindowMock.mockReturnValue({ webContents })
    uploadClipboardFilesWithInfoMock.mockResolvedValue([clipboardImage])
    uploadSelectedFilesWithInfoMock.mockResolvedValue(selectedImages)

    const mod = await import('../../main/server')
    const server = mod.default
    server.startup()

    expect(installedUploadAdapter).toBeDefined()
    const adapter = installedUploadAdapter!

    await expect(adapter.uploadClipboard()).resolves.toEqual([clipboardImage])
    await expect(adapter.uploadPaths(['/tmp/a.png'])).resolves.toEqual(selectedImages)
    expect(uploadClipboardFilesWithInfoMock).toHaveBeenCalledTimes(1)
    expect(getAvailableWindowMock).toHaveBeenCalledTimes(1)
    expect(uploadSelectedFilesWithInfoMock).toHaveBeenCalledWith(webContents, [{ path: '/tmp/a.png' }])
    expect(adapter.getTempDir()).toBe('/tmp/picgo-form-images')
    expect(getFormImageFolderPathMock).toHaveBeenCalledTimes(1)
  })
})
