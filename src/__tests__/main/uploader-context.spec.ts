import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebContents } from 'electron'
import type { UploadOptions } from 'picgo'
import { GET_RENAME_FILE_NAME, RENAME_FILE_NAME } from '~/universal/events/constants'

interface RenameContext {
  output: ImgInfo[]
  getConfig: <T>(name: string) => T
}

interface RenamePlugin {
  handle: (context: RenameContext) => Promise<void>
}

interface ReportOptions {
  fromClipboard: boolean
  duration: number
  outputList: ImgInfo[]
}

type EventListener = (...args: unknown[]) => void

const mocks = vi.hoisted(() => {
  const picgoListeners = new Map<string, Set<EventListener>>()
  const ipcListeners = new Map<string, Set<EventListener>>()
  let renameHandler: RenamePlugin['handle'] | undefined

  const addListener = (listeners: Map<string, Set<EventListener>>, event: string, listener: EventListener) => {
    const eventListeners = listeners.get(event) ?? new Set<EventListener>()
    eventListeners.add(listener)
    listeners.set(event, eventListeners)
  }
  const removeListener = (listeners: Map<string, Set<EventListener>>, event: string, listener: EventListener) => {
    listeners.get(event)?.delete(listener)
  }
  const emit = (listeners: Map<string, Set<EventListener>>, event: string, ...args: unknown[]) => {
    for (const listener of [...(listeners.get(event) ?? [])]) {
      listener(...args)
    }
  }

  const uploadMock = vi.fn<(input?: IUploadOption, options?: UploadOptions) => Promise<ImgInfo[] | Error>>()
  const reportUploadDataMock = vi.fn<(webContents: WebContents, options: ReportOptions) => Promise<void>>()
  const privacyCheckMock = vi.fn<() => Promise<boolean>>()
  const getClipboardFilePathListMock = vi.fn<() => string[]>()
  const writeFileMock = vi.fn<(filePath: string, data: Buffer) => Promise<void>>()
  const unlinkMock = vi.fn<(filePath: string) => Promise<void>>()
  const readImageMock = vi.fn()
  const createWindowMock = vi.fn()
  const deleteWindowMock = vi.fn()

  return {
    uploadMock,
    reportUploadDataMock,
    privacyCheckMock,
    getClipboardFilePathListMock,
    writeFileMock,
    unlinkMock,
    readImageMock,
    createWindowMock,
    deleteWindowMock,
    loggerErrorMock: vi.fn(),
    showNotificationMock: vi.fn(),
    picgo: {
      baseDir: '/picgo-base',
      upload: uploadMock,
      getConfig: vi.fn(),
      on: vi.fn((event: string, listener: EventListener) => {
        addListener(picgoListeners, event, listener)
      }),
      helper: {
        beforeUploadPlugins: {
          register: vi.fn((_name: string, plugin: RenamePlugin) => {
            renameHandler = plugin.handle
          })
        }
      }
    },
    ipcMain: {
      on: vi.fn((event: string, listener: EventListener) => {
        addListener(ipcListeners, event, listener)
      }),
      removeListener: vi.fn((event: string, listener: EventListener) => {
        removeListener(ipcListeners, event, listener)
      })
    },
    emitPicgo: (event: string, ...args: unknown[]) => {
      emit(picgoListeners, event, ...args)
    },
    emitIpc: (event: string, ...args: unknown[]) => {
      emit(ipcListeners, event, ...args)
    },
    addIpcListener: (event: string, listener: EventListener) => {
      addListener(ipcListeners, event, listener)
    },
    removeIpcListener: (event: string, listener: EventListener) => {
      removeListener(ipcListeners, event, listener)
    },
    ipcListenerCount: (event: string) => ipcListeners.get(event)?.size ?? 0,
    resetIpcListeners: () => ipcListeners.clear(),
    getRenameHandler: () => renameHandler
  }
})

vi.mock('electron', () => ({
  clipboard: {
    readImage: mocks.readImageMock
  },
  ipcMain: mocks.ipcMain
}))

vi.mock('@core/picgo', () => ({
  default: mocks.picgo
}))

vi.mock('@core/picgo/logger', () => ({
  default: {
    error: mocks.loggerErrorMock,
    info: vi.fn()
  }
}))

vi.mock('apis/app/window/windowManager', () => ({
  default: {
    create: mocks.createWindowMock,
    deleteById: mocks.deleteWindowMock
  }
}))

vi.mock('~/main/utils/common', () => ({
  getClipboardFilePathList: mocks.getClipboardFilePathListMock,
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

vi.mock('write-file-atomic', () => ({
  default: mocks.writeFileMock
}))

vi.mock('fs-extra', () => ({
  default: {
    unlink: mocks.unlinkMock
  }
}))

import uploader from '~/main/apis/app/uploader'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

interface WebContentsStub {
  id: number
  isDestroyed: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
  setDestroyed: (destroyed: boolean) => void
}

interface RenameWindowStub {
  id: number
  webContents: WebContentsStub
  close: ReturnType<typeof vi.fn>
  isDestroyed: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  emitClose: () => void
}

const createDeferred = <T = void>(): Deferred<T> => {
  let resolvePromise: (value: T) => void = () => undefined
  let rejectPromise: (reason?: unknown) => void = () => undefined
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise
  }
}

const createWebContents = (id: number): WebContentsStub => {
  let destroyed = false
  return {
    id,
    isDestroyed: vi.fn(() => destroyed),
    send: vi.fn(),
    setDestroyed: (nextDestroyed: boolean) => {
      destroyed = nextDestroyed
    }
  }
}

const asWebContents = (webContents: WebContentsStub): WebContents => {
  return webContents as unknown as WebContents
}

const createRenameWindow = (id: number, webContentsId: number): RenameWindowStub => {
  const listeners = new Map<string, Set<EventListener>>()
  let destroyed = false
  const webContents = createWebContents(webContentsId)
  const window: RenameWindowStub = {
    id,
    webContents,
    close: vi.fn(() => {
      destroyed = true
      for (const listener of [...(listeners.get('close') ?? [])]) {
        listener()
      }
    }),
    isDestroyed: vi.fn(() => destroyed),
    on: vi.fn((event: string, listener: EventListener) => {
      const eventListeners = listeners.get(event) ?? new Set<EventListener>()
      eventListeners.add(listener)
      listeners.set(event, eventListeners)
      return window
    }),
    removeListener: vi.fn((event: string, listener: EventListener) => {
      listeners.get(event)?.delete(listener)
      return window
    }),
    emitClose: () => {
      for (const listener of [...(listeners.get('close') ?? [])]) {
        listener()
      }
    }
  }
  return window
}

const createImage = (name: string): ImgInfo => ({
  fileName: name,
  extname: '.png',
  imgUrl: `https://example.test/${name}`
})

const createRenameContext = (output: ImgInfo[]): RenameContext => ({
  output,
  getConfig: <T>(name: string): T => (name === 'settings.rename') as T
})

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('Uploader task context', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mocks.resetIpcListeners()
    mocks.uploadMock.mockReset()
    mocks.reportUploadDataMock.mockReset()
    mocks.reportUploadDataMock.mockResolvedValue(undefined)
    mocks.privacyCheckMock.mockReset()
    mocks.privacyCheckMock.mockResolvedValue(true)
    mocks.getClipboardFilePathListMock.mockReset()
    mocks.getClipboardFilePathListMock.mockReturnValue([])
    mocks.writeFileMock.mockReset()
    mocks.writeFileMock.mockResolvedValue(undefined)
    mocks.unlinkMock.mockReset()
    mocks.unlinkMock.mockResolvedValue(undefined)
    mocks.readImageMock.mockReset()
    mocks.createWindowMock.mockReset()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('keeps interleaved progress and reports bound to the originating window and suppresses late events', async () => {
    const progressA = createDeferred()
    const progressB = createDeferred()
    const finishA = createDeferred()
    const finishB = createDeferred()
    const lateEvent = createDeferred()
    const imageA = createImage('a.png')
    const imageB = createImage('b.png')
    const windowA = createWebContents(1)
    const windowB = createWebContents(2)
    const optionsA: UploadOptions = { uploader: 'github', configId: 'a-id' }
    const optionsB: UploadOptions = { uploader: 's3', configName: 'B' }
    let lateEventPromise: Promise<void> | undefined

    mocks.uploadMock
      .mockImplementationOnce(async () => {
        await progressA.promise
        mocks.emitPicgo('uploadProgress', 25)
        lateEventPromise = lateEvent.promise.then(() => {
          mocks.emitPicgo('uploadProgress', 99)
        })
        await finishA.promise
        return [imageA]
      })
      .mockImplementationOnce(async () => {
        await progressB.promise
        mocks.emitPicgo('uploadProgress', 50)
        await finishB.promise
        return [imageB]
      })

    const uploadA = uploader.upload({
      input: ['/a.png'],
      webContents: asWebContents(windowA),
      options: optionsA
    })
    const uploadB = uploader.upload({
      input: ['/b.png'],
      webContents: asWebContents(windowB),
      options: optionsB
    })

    progressB.resolve()
    await flushPromises()
    progressA.resolve()
    await flushPromises()

    expect(windowA.send).toHaveBeenCalledWith('uploadProgress', 25)
    expect(windowA.send).not.toHaveBeenCalledWith('uploadProgress', 50)
    expect(windowB.send).toHaveBeenCalledWith('uploadProgress', 50)
    expect(windowB.send).not.toHaveBeenCalledWith('uploadProgress', 25)

    finishB.resolve()
    await expect(uploadB).resolves.toEqual([imageB])
    finishA.resolve()
    await expect(uploadA).resolves.toEqual([imageA])

    expect(mocks.uploadMock).toHaveBeenNthCalledWith(1, ['/a.png'], optionsA)
    expect(mocks.uploadMock).toHaveBeenNthCalledWith(2, ['/b.png'], optionsB)
    expect(mocks.reportUploadDataMock).toHaveBeenCalledWith(asWebContents(windowA), expect.objectContaining({
      outputList: [imageA]
    }))
    expect(mocks.reportUploadDataMock).toHaveBeenCalledWith(asWebContents(windowB), expect.objectContaining({
      outputList: [imageB]
    }))

    lateEvent.resolve()
    await lateEventPromise
    mocks.emitPicgo('uploadProgress', 100)

    expect(windowA.send).not.toHaveBeenCalledWith('uploadProgress', 99)
    expect(windowA.send).not.toHaveBeenCalledWith('uploadProgress', 100)
    expect(windowB.send).not.toHaveBeenCalledWith('uploadProgress', 99)
    expect(windowB.send).not.toHaveBeenCalledWith('uploadProgress', 100)
  })

  it('cleans a failed task rename listeners without breaking another dialog or unrelated listeners', async () => {
    const renameHandler = mocks.getRenameHandler()
    expect(renameHandler).toBeDefined()
    if (!renameHandler) return

    const failedWindow = createRenameWindow(10, 110)
    const survivingWindow = createRenameWindow(20, 120)
    const failedImages = [createImage('failed-a.png'), createImage('failed-b.png')]
    const survivingImage = createImage('surviving.png')
    const taskWindowA = createWebContents(11)
    const taskWindowB = createWebContents(12)
    const unrelatedReadyListener = vi.fn()
    mocks.addIpcListener(GET_RENAME_FILE_NAME, unrelatedReadyListener)
    mocks.createWindowMock
      .mockReturnValueOnce(failedWindow)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(survivingWindow)
    mocks.uploadMock
      .mockImplementationOnce(async () => {
        await renameHandler(createRenameContext(failedImages))
        return failedImages
      })
      .mockImplementationOnce(async () => {
        await renameHandler(createRenameContext([survivingImage]))
        mocks.emitPicgo('uploadProgress', 75)
        return [survivingImage]
      })

    const failedUpload = uploader.upload({ webContents: asWebContents(taskWindowA) })
    const survivingUpload = uploader.upload({ webContents: asWebContents(taskWindowB) })
    await flushPromises()

    await expect(failedUpload).resolves.toBe(false)
    expect(mocks.ipcListenerCount(`${RENAME_FILE_NAME}${failedWindow.webContents.id}`)).toBe(0)
    expect(mocks.ipcListenerCount(`${RENAME_FILE_NAME}${survivingWindow.webContents.id}`)).toBe(1)
    expect(mocks.ipcListenerCount(GET_RENAME_FILE_NAME)).toBe(2)

    mocks.emitIpc(GET_RENAME_FILE_NAME, { sender: { id: survivingWindow.webContents.id } })
    expect(survivingWindow.webContents.send).toHaveBeenCalledWith(
      RENAME_FILE_NAME,
      'surviving.png',
      'surviving.png',
      survivingWindow.webContents.id
    )
    mocks.emitIpc(
      `${RENAME_FILE_NAME}${survivingWindow.webContents.id}`,
      { sender: { id: survivingWindow.webContents.id } },
      'renamed.png'
    )

    await expect(survivingUpload).resolves.toEqual([
      expect.objectContaining({ fileName: 'renamed.png' })
    ])
    expect(taskWindowB.send).toHaveBeenCalledWith('uploadProgress', 75)
    expect(mocks.ipcListenerCount(`${RENAME_FILE_NAME}${survivingWindow.webContents.id}`)).toBe(0)
    expect(mocks.ipcListenerCount(GET_RENAME_FILE_NAME)).toBe(1)
    expect(unrelatedReadyListener).toHaveBeenCalledTimes(1)

    mocks.removeIpcListener(GET_RENAME_FILE_NAME, unrelatedReadyListener)
  })

  it('skips progress and reporting when the captured window is destroyed', async () => {
    const continueUpload = createDeferred()
    const window = createWebContents(3)
    const image = createImage('destroyed.png')
    mocks.uploadMock.mockImplementation(async () => {
      await continueUpload.promise
      mocks.emitPicgo('uploadProgress', 40)
      return [image]
    })

    const upload = uploader.upload({
      input: ['/destroyed.png'],
      webContents: asWebContents(window)
    })
    window.setDestroyed(true)
    continueUpload.resolve()

    await expect(upload).resolves.toEqual([image])
    expect(window.send).not.toHaveBeenCalled()
    expect(mocks.reportUploadDataMock).not.toHaveBeenCalled()
  })

  it('does not fail a successful upload when reporting rejects', async () => {
    const window = createWebContents(4)
    const image = createImage('report-error.png')
    const reportError = new Error('report failed')
    mocks.uploadMock.mockResolvedValue([image])
    mocks.reportUploadDataMock.mockRejectedValue(reportError)

    await expect(uploader.upload({
      input: ['/report-error.png'],
      webContents: asWebContents(window)
    })).resolves.toEqual([image])
    expect(mocks.loggerErrorMock).toHaveBeenCalledWith(reportError)
  })

  it('forwards options for the Core clipboard path and preserves default uploads', async () => {
    const window = createWebContents(5)
    const clipboardImage = createImage('core-clipboard.png')
    const defaultImage = createImage('default.png')
    const options: UploadOptions = { uploader: 'github', configName: 'Work' }
    mocks.uploadMock
      .mockResolvedValueOnce([clipboardImage])
      .mockResolvedValueOnce([defaultImage])

    await expect(uploader.upload({
      webContents: asWebContents(window),
      options
    })).resolves.toEqual([clipboardImage])
    await expect(uploader.upload()).resolves.toEqual([defaultImage])

    expect(mocks.uploadMock).toHaveBeenNthCalledWith(1, undefined, options)
    expect(mocks.uploadMock).toHaveBeenNthCalledWith(2, undefined, undefined)
    expect(mocks.reportUploadDataMock).toHaveBeenCalledWith(asWebContents(window), expect.objectContaining({
      fromClipboard: true,
      outputList: [clipboardImage]
    }))
  })

  it('forwards options and window ownership for existing clipboard file paths without deleting them', async () => {
    const window = createWebContents(6)
    const image = createImage('existing-clipboard.png')
    const options: UploadOptions = { uploader: 's3', configId: 'existing-id' }
    mocks.getClipboardFilePathListMock.mockReturnValue(['/existing/clipboard.png'])
    mocks.uploadMock.mockImplementation(async () => {
      mocks.emitPicgo('uploadProgress', 60)
      return [image]
    })

    await expect(uploader.uploadWithBuildInClipboard({
      webContents: asWebContents(window),
      options
    })).resolves.toEqual([image])

    expect(mocks.uploadMock).toHaveBeenCalledWith(['/existing/clipboard.png'], options)
    expect(window.send).toHaveBeenCalledWith('uploadProgress', 60)
    expect(mocks.reportUploadDataMock).toHaveBeenCalledWith(asWebContents(window), expect.any(Object))
    expect(mocks.writeFileMock).not.toHaveBeenCalled()
    expect(mocks.unlinkMock).not.toHaveBeenCalled()
  })

  it('awaits cleanup of generated clipboard images while forwarding task options and ownership', async () => {
    const window = createWebContents(7)
    const image = createImage('generated-clipboard.png')
    const options: UploadOptions = { uploader: 'github', configId: 'generated-id' }
    const unlink = createDeferred()
    const unlinkStarted = createDeferred()
    let uploadSettled = false
    mocks.readImageMock.mockReturnValue({
      isEmpty: () => false,
      toPNG: () => Buffer.from('png')
    })
    mocks.uploadMock.mockResolvedValue([image])
    mocks.unlinkMock.mockImplementation(async () => {
      unlinkStarted.resolve()
      await unlink.promise
    })

    const uploadPromise = uploader.uploadWithBuildInClipboard({
      webContents: asWebContents(window),
      options
    })
    const trackedUpload = uploadPromise.then((result) => {
      uploadSettled = true
      return result
    })
    await unlinkStarted.promise

    expect(mocks.writeFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/picgo-base\/.*\/\d{17}\.png$/),
      Buffer.from('png')
    )
    const generatedPath = mocks.writeFileMock.mock.calls[0][0]
    expect(mocks.uploadMock).toHaveBeenCalledWith([generatedPath], options)
    expect(mocks.unlinkMock).toHaveBeenCalledWith(generatedPath)
    expect(uploadSettled).toBe(false)

    unlink.resolve()
    await expect(trackedUpload).resolves.toEqual([image])
    expect(uploadSettled).toBe(true)
    expect(mocks.reportUploadDataMock).toHaveBeenCalledWith(asWebContents(window), expect.any(Object))
  })
})
