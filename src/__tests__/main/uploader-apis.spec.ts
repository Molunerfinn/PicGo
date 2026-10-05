import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebContents } from 'electron'
import type { UploadOptions } from 'picgo'
import { IPasteStyle, IRPCActionType, IWindowList } from '#/types/enum'
import {
  uploadClipboardFiles,
  uploadClipboardFilesWithInfo,
  uploadSelectedFiles,
  uploadSelectedFilesWithInfo
} from '../../main/apis/app/uploader/apis'

type WebContentsStub = {
  send: ReturnType<typeof vi.fn>
  isDestroyed: ReturnType<typeof vi.fn>
}

type WindowStub = {
  webContents: WebContentsStub
}

const mocks = vi.hoisted(() => {
  const configValues: Record<string, unknown> = {}
  return {
    configValues,
    getConfigMock: vi.fn(),
    loggerInfoMock: vi.fn(),
    uploadMock: vi.fn(),
    uploadWithBuildInClipboardMock: vi.fn(),
    getAvailableWindowMock: vi.fn(),
    windowManagerGetMock: vi.fn(),
    windowManagerHasMock: vi.fn(),
    pasteTemplateMock: vi.fn(),
    albumInsertMock: vi.fn(),
    handleCopyUrlMock: vi.fn(),
    handleUrlEncodeWithSettingMock: vi.fn(),
    showNotificationMock: vi.fn(),
    TMock: vi.fn()
  }
})

vi.mock('@core/picgo', () => ({
  default: {
    getConfig: mocks.getConfigMock
  }
}))

vi.mock('@core/picgo/logger', () => ({
  default: {
    info: mocks.loggerInfoMock
  }
}))

vi.mock('../../main/apis/app/uploader', () => ({
  default: {
    upload: mocks.uploadMock,
    uploadWithBuildInClipboard: mocks.uploadWithBuildInClipboardMock
  }
}))

vi.mock('apis/app/window/windowManager', () => ({
  default: {
    getAvailableWindow: mocks.getAvailableWindowMock,
    get: mocks.windowManagerGetMock,
    has: mocks.windowManagerHasMock
  }
}))

vi.mock('~/main/utils/pasteTemplate', () => ({
  default: mocks.pasteTemplateMock
}))

vi.mock('~/main/apis/core/datastore', () => ({
  AlbumDB: {
    getInstance: () => ({
      insert: mocks.albumInsertMock
    })
  }
}))

vi.mock('~/main/utils/common', () => ({
  handleCopyUrl: mocks.handleCopyUrlMock,
  handleUrlEncodeWithSetting: mocks.handleUrlEncodeWithSettingMock,
  showNotification: mocks.showNotificationMock
}))

vi.mock('~/main/i18n/index', () => ({
  T: mocks.TMock
}))

const createWebContents = (): WebContentsStub => ({
  send: vi.fn(),
  isDestroyed: vi.fn(() => false)
})

const asWebContents = (webContents: WebContentsStub): WebContents => {
  return webContents as unknown as WebContents
}

describe('main uploader API helpers', () => {
  let availableWindow: WindowStub
  let trayWindow: WindowStub
  let settingWindow: WindowStub

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    Object.keys(mocks.configValues).forEach((key) => {
      delete mocks.configValues[key]
    })
    Object.assign(mocks.configValues, {
      'settings.pasteStyle': IPasteStyle.MARKDOWN,
      'settings.customLink': '$url',
      'settings.useBuiltinClipboard': false
    })

    availableWindow = { webContents: createWebContents() }
    trayWindow = { webContents: createWebContents() }
    settingWindow = { webContents: createWebContents() }

    mocks.getConfigMock.mockImplementation(<T>(key: string): T => mocks.configValues[key] as T)
    mocks.getAvailableWindowMock.mockReturnValue(availableWindow)
    mocks.windowManagerGetMock.mockImplementation((name: IWindowList) => {
      if (name === IWindowList.TRAY_WINDOW) return trayWindow
      if (name === IWindowList.SETTING_WINDOW) return settingWindow
      return undefined
    })
    mocks.windowManagerHasMock.mockImplementation((name: IWindowList) => name === IWindowList.SETTING_WINDOW)
    mocks.pasteTemplateMock.mockImplementation((style: IPasteStyle, item: ImgInfo, customLink?: string) => {
      return `paste:${style}:${item.imgUrl ?? ''}:${customLink ?? ''}`
    })
    mocks.handleUrlEncodeWithSettingMock.mockImplementation((url: string) => `encoded:${url}`)
    mocks.TMock.mockImplementation((key: string) => `t:${key}`)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('preserves clipboard upload side effects and returns raw image info for server adapters', async () => {
    const image: ImgInfo = {
      imgUrl: 'https://raw.example/clipboard image.png',
      fileName: 'clipboard image.png',
      extname: '.png',
      origin: 'clipboard',
      size: 123
    }
    mocks.uploadMock.mockResolvedValue([image])

    const result = await uploadClipboardFilesWithInfo()
    vi.runOnlyPendingTimers()

    expect(result).toEqual([image])
    expect(mocks.loggerInfoMock).toHaveBeenCalledWith('upload clipboard file')
    expect(mocks.uploadMock).toHaveBeenCalledWith({
      webContents: availableWindow.webContents,
      options: undefined
    })
    expect(mocks.handleCopyUrlMock).toHaveBeenCalledWith(`paste:${IPasteStyle.MARKDOWN}:${image.imgUrl}:$url`)
    expect(mocks.showNotificationMock).toHaveBeenCalledWith({
      title: 't:UPLOAD_SUCCEED',
      body: image.imgUrl
    })
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(image)
    expect(trayWindow.webContents.send).toHaveBeenCalledWith('clipboardFiles', [])
    expect(trayWindow.webContents.send).toHaveBeenCalledWith('uploadFiles', [image])
    expect(settingWindow.webContents.send).toHaveBeenCalledWith(IRPCActionType.UPDATE_ALBUM)
  })

  it('keeps legacy clipboard helper return value URL-encoded while preserving raw side effects', async () => {
    const image: ImgInfo = {
      imgUrl: 'https://raw.example/clipboard image.png',
      fileName: 'clipboard image.png',
      extname: '.png'
    }
    mocks.uploadMock.mockResolvedValue([image])

    const result = await uploadClipboardFiles()
    vi.runOnlyPendingTimers()

    expect(result).toBe(`encoded:${image.imgUrl}`)
    expect(mocks.handleUrlEncodeWithSettingMock).toHaveBeenCalledWith(image.imgUrl)
    expect(mocks.handleCopyUrlMock).toHaveBeenCalledWith(`paste:${IPasteStyle.MARKDOWN}:${image.imgUrl}:$url`)
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(image)
    expect(trayWindow.webContents.send).toHaveBeenCalledWith('uploadFiles', [image])
  })

  it('forwards clipboard options to the supplied origin window without consulting the fallback window', async () => {
    const originWebContents = createWebContents()
    const options: UploadOptions = {
      uploader: 'github',
      configName: 'Work',
      configId: 'github-work-id'
    }
    mocks.uploadMock.mockResolvedValue([])

    const result = await uploadClipboardFilesWithInfo(options, asWebContents(originWebContents))

    expect(result).toEqual([])
    expect(mocks.getAvailableWindowMock).not.toHaveBeenCalled()
    expect(mocks.uploadMock).toHaveBeenCalledWith({
      webContents: originWebContents,
      options
    })
  })

  it('uses the builtin clipboard upload path when configured', async () => {
    const image: ImgInfo = {
      imgUrl: 'https://raw.example/builtin.png',
      fileName: 'builtin.png',
      extname: '.png'
    }
    const options: UploadOptions = {
      uploader: 'smms',
      configName: 'Personal',
      configId: 'smms-personal-id'
    }
    mocks.configValues['settings.useBuiltinClipboard'] = true
    mocks.uploadWithBuildInClipboardMock.mockResolvedValue([image])

    const result = await uploadClipboardFilesWithInfo(options)
    vi.runOnlyPendingTimers()

    expect(result).toEqual([image])
    expect(mocks.uploadWithBuildInClipboardMock).toHaveBeenCalledWith({
      webContents: availableWindow.webContents,
      options
    })
    expect(mocks.uploadMock).not.toHaveBeenCalled()
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(image)
  })

  it('preserves selected-file upload side effects and returns raw image info for server adapters', async () => {
    const webContents = createWebContents()
    const files: IFileWithPath[] = [{ path: '/tmp/a.png' }, { path: '/tmp/b.png' }]
    const images: ImgInfo[] = [
      {
        imgUrl: 'https://raw.example/a image.png',
        fileName: 'a image.png',
        extname: '.png',
        origin: '/tmp/a.png',
        width: 10
      },
      {
        imgUrl: 'https://raw.example/b image.png',
        fileName: 'b image.png',
        extname: '.png',
        origin: '/tmp/b.png',
        height: 20
      }
    ]
    mocks.uploadMock.mockResolvedValue(images)

    const result = await uploadSelectedFilesWithInfo(asWebContents(webContents), files)
    vi.runOnlyPendingTimers()

    expect(result).toEqual(images)
    expect(mocks.uploadMock).toHaveBeenCalledWith({
      input: ['/tmp/a.png', '/tmp/b.png'],
      webContents,
      options: undefined
    })
    expect(mocks.handleCopyUrlMock).toHaveBeenCalledWith([
      `paste:${IPasteStyle.MARKDOWN}:${images[0].imgUrl}:$url`,
      `paste:${IPasteStyle.MARKDOWN}:${images[1].imgUrl}:$url`
    ].join('\n'))
    expect(mocks.showNotificationMock).toHaveBeenCalledWith({
      title: 't:UPLOAD_SUCCEED',
      body: images[0].imgUrl
    })
    expect(mocks.showNotificationMock).toHaveBeenCalledWith({
      title: 't:UPLOAD_SUCCEED',
      body: images[1].imgUrl
    })
    expect(mocks.albumInsertMock).toHaveBeenNthCalledWith(1, images[0])
    expect(mocks.albumInsertMock).toHaveBeenNthCalledWith(2, images[1])
    expect(trayWindow.webContents.send).toHaveBeenCalledWith('uploadFiles', images)
    expect(settingWindow.webContents.send).toHaveBeenCalledWith(IRPCActionType.UPDATE_ALBUM)
  })

  it('forwards selected-file options without changing the raw result or side effects', async () => {
    const webContents = createWebContents()
    const files: IFileWithPath[] = [{ path: '/tmp/a.png' }]
    const image: ImgInfo = {
      imgUrl: 'https://raw.example/a image.png',
      fileName: 'a image.png',
      extname: '.png',
      origin: '/tmp/a.png'
    }
    const options: UploadOptions = {
      uploader: 'github',
      configName: 'Work',
      configId: 'github-work-id'
    }
    mocks.uploadMock.mockResolvedValue([image])

    const result = await uploadSelectedFilesWithInfo(asWebContents(webContents), files, options)
    vi.runOnlyPendingTimers()

    expect(result).toEqual([image])
    expect(mocks.uploadMock).toHaveBeenCalledWith({
      input: ['/tmp/a.png'],
      webContents,
      options
    })
    expect(mocks.handleCopyUrlMock).toHaveBeenCalledWith(`paste:${IPasteStyle.MARKDOWN}:${image.imgUrl}:$url`)
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(image)
    expect(trayWindow.webContents.send).toHaveBeenCalledWith('uploadFiles', [image])
    expect(settingWindow.webContents.send).toHaveBeenCalledWith(IRPCActionType.UPDATE_ALBUM)
  })

  it('does not send post-upload updates to destroyed managed windows', async () => {
    const webContents = createWebContents()
    const image: ImgInfo = {
      imgUrl: 'https://raw.example/a.png',
      fileName: 'a.png'
    }
    trayWindow.webContents.isDestroyed.mockReturnValue(true)
    settingWindow.webContents.isDestroyed.mockReturnValue(true)
    mocks.uploadMock.mockResolvedValue([image])

    await uploadSelectedFilesWithInfo(asWebContents(webContents), [{ path: '/tmp/a.png' }])
    vi.runOnlyPendingTimers()

    expect(trayWindow.webContents.send).not.toHaveBeenCalled()
    expect(settingWindow.webContents.send).not.toHaveBeenCalled()
  })

  it('keeps legacy selected-file helper return values URL-encoded', async () => {
    const webContents = createWebContents()
    const files: IFileWithPath[] = [{ path: '/tmp/a.png' }, { path: '/tmp/b.png' }]
    const images: ImgInfo[] = [
      { imgUrl: 'https://raw.example/a image.png', fileName: 'a image.png' },
      { imgUrl: 'https://raw.example/b image.png', fileName: 'b image.png' }
    ]
    mocks.uploadMock.mockResolvedValue(images)

    const result = await uploadSelectedFiles(asWebContents(webContents), files)
    vi.runOnlyPendingTimers()

    expect(result).toEqual([
      `encoded:${images[0].imgUrl}`,
      `encoded:${images[1].imgUrl}`
    ])
    expect(mocks.handleUrlEncodeWithSettingMock).toHaveBeenNthCalledWith(1, images[0].imgUrl)
    expect(mocks.handleUrlEncodeWithSettingMock).toHaveBeenNthCalledWith(2, images[1].imgUrl)
    expect(mocks.albumInsertMock).toHaveBeenNthCalledWith(1, images[0])
    expect(mocks.albumInsertMock).toHaveBeenNthCalledWith(2, images[1])
  })
})
