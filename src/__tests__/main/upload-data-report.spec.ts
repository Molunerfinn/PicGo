import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebContents } from 'electron'
import { REGISTER_DEVICE_ID, TALKING_DATA_EVENT } from '~/universal/events/constants'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

interface WebContentsStub {
  send: ReturnType<typeof vi.fn>
  isDestroyed: ReturnType<typeof vi.fn>
}

interface TalkingDataPayload {
  EventId: string
  MapKv: Record<string, unknown>
}

const mocks = vi.hoisted(() => ({
  appGetVersion: vi.fn(() => '3.0.2-test'),
  deviceIdGetId: vi.fn(),
  getConfig: vi.fn(),
  getVideoDuration: vi.fn(),
  ipcMainOnce: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    getVersion: mocks.appGetVersion
  },
  ipcMain: {
    once: mocks.ipcMainOnce
  }
}))

vi.mock('../../main/utils/deviceId', () => ({
  deviceIdManager: {
    getId: mocks.deviceIdGetId
  }
}))

vi.mock('@core/picgo', () => ({
  default: {
    getConfig: mocks.getConfig
  }
}))

vi.mock('@picgo/video-duration', () => ({
  getVideoDuration: mocks.getVideoDuration
}))

const createDeferred = <T>(): Deferred<T> => {
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

const createWebContents = (): WebContentsStub => ({
  send: vi.fn(),
  isDestroyed: vi.fn(() => false)
})

const asWebContents = (webContents: WebContentsStub): WebContents => {
  return webContents as unknown as WebContents
}

const isTalkingDataPayload = (value: unknown): value is TalkingDataPayload => {
  if (typeof value !== 'object' || value === null) return false
  if (!('EventId' in value) || typeof value.EventId !== 'string') return false
  return 'MapKv' in value && typeof value.MapKv === 'object' && value.MapKv !== null
}

const getTalkingDataPayloads = (webContents: WebContentsStub): TalkingDataPayload[] => {
  return webContents.send.mock.calls.flatMap(([channel, payload]) => {
    if (channel !== TALKING_DATA_EVENT || !isTalkingDataPayload(payload)) return []
    return [payload]
  })
}

const getPayloadByEventId = (payloads: TalkingDataPayload[], eventId: string): TalkingDataPayload => {
  const payload = payloads.find(item => item.EventId === eventId)
  if (!payload) {
    throw new Error(`Missing analytics event ${eventId}`)
  }
  return payload
}

describe('upload data reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mocks.deviceIdGetId.mockResolvedValue('device-id')
    mocks.getConfig.mockImplementation((key: string) => {
      if (key === 'picBed.uploader') return 'root-default'
      if (key === 'picBed.current') return 'root-current'
      return undefined
    })
    mocks.getVideoDuration.mockResolvedValue({
      duration: 5_000,
      size: 10 * 1024 * 1024
    })
  })

  it('reports the uploader stamped on the batch and each uploaded item', async () => {
    const webContents = createWebContents()
    const { dataReportManager } = await import('../../main/utils/dataReport')

    await dataReportManager.reportUploadData(asWebContents(webContents), {
      fromClipboard: false,
      duration: 750,
      outputList: [
        {
          fileName: 'image.png',
          filePath: '/tmp/image.png',
          mimeType: 'image/png',
          size: 1024,
          type: 'github'
        },
        {
          fileName: 'video.mp4',
          filePath: '/tmp/video.mp4',
          mimeType: 'video/mp4',
          size: 10 * 1024 * 1024,
          type: 's3'
        },
        {
          fileName: 'archive.zip',
          filePath: '/tmp/archive.zip',
          mimeType: 'application/zip',
          size: 2048,
          type: 'webdav'
        }
      ]
    })

    const payloads = getTalkingDataPayloads(webContents)
    expect(getPayloadByEventId(payloads, 'upload').MapKv.type).toBe('github')
    expect(getPayloadByEventId(payloads, 'upload_image').MapKv.type).toBe('github')
    expect(getPayloadByEventId(payloads, 'upload_video').MapKv.type).toBe('s3')
    expect(getPayloadByEventId(payloads, 'upload_file').MapKv.type).toBe('webdav')
    expect(mocks.getConfig).not.toHaveBeenCalled()

    for (const payload of payloads) {
      expect(payload.MapKv).not.toHaveProperty('configName')
      expect(payload.MapKv).not.toHaveProperty('configId')
    }
  })

  it('uses the legacy root uploader only when output metadata has no uploader type', async () => {
    const webContents = createWebContents()
    const { dataReportManager } = await import('../../main/utils/dataReport')

    await dataReportManager.reportUploadData(asWebContents(webContents), {
      fromClipboard: false,
      duration: 750,
      outputList: [{
        fileName: 'image.png',
        filePath: '/tmp/image.png',
        mimeType: 'image/png',
        size: 1024
      }]
    })

    const payloads = getTalkingDataPayloads(webContents)
    expect(getPayloadByEventId(payloads, 'upload').MapKv.type).toBe('root-default')
    expect(getPayloadByEventId(payloads, 'upload_image').MapKv.type).toBe('root-default')
    expect(mocks.getConfig).toHaveBeenCalledTimes(1)
    expect(mocks.getConfig).toHaveBeenCalledWith('picBed.uploader')
  })

  it.each([
    { uploader: undefined, current: undefined, expected: 'picgo-cloud' },
    { uploader: '', current: '', expected: 'picgo-cloud' },
    { uploader: undefined, current: 'smms', expected: 'smms' },
    { uploader: 'smms', current: 'picgo-cloud', expected: 'smms' }
  ])('resolves the root fallback as $expected for uploader=$uploader current=$current', async ({ uploader, current, expected }) => {
    mocks.getConfig.mockImplementation((key: string) => {
      if (key === 'picBed.uploader') return uploader
      if (key === 'picBed.current') return current
      return undefined
    })
    const webContents = createWebContents()
    const { dataReportManager } = await import('../../main/utils/dataReport')

    await dataReportManager.reportUploadData(asWebContents(webContents), {
      fromClipboard: false,
      duration: 100,
      outputList: [{ fileName: 'image.png', mimeType: 'image/png', size: 1024 }]
    })

    const payloads = getTalkingDataPayloads(webContents)
    expect(getPayloadByEventId(payloads, 'upload').MapKv.type).toBe(expected)
    expect(getPayloadByEventId(payloads, 'upload_image').MapKv.type).toBe(expected)
  })

  it('does not register or report after the origin window is destroyed during device initialization', async () => {
    const deviceId = createDeferred<string>()
    const webContents = createWebContents()
    mocks.deviceIdGetId.mockReturnValue(deviceId.promise)
    const { dataReportManager } = await import('../../main/utils/dataReport')

    const reportPromise = dataReportManager.reportUploadData(asWebContents(webContents), {
      fromClipboard: false,
      duration: 100,
      outputList: [{
        fileName: 'image.png',
        mimeType: 'image/png',
        type: 'github'
      }]
    })
    expect(mocks.deviceIdGetId).toHaveBeenCalledTimes(1)
    webContents.isDestroyed.mockReturnValue(true)
    deviceId.resolve('device-id')

    await expect(reportPromise).resolves.toBeUndefined()
    expect(webContents.send).not.toHaveBeenCalled()
  })

  it('suppresses an item report when the origin window is destroyed during async metadata work', async () => {
    const metadata = createDeferred<{ duration: number, size: number }>()
    const webContents = createWebContents()
    mocks.getVideoDuration.mockReturnValue(metadata.promise)
    const { dataReportManager } = await import('../../main/utils/dataReport')

    const reportPromise = dataReportManager.reportUploadData(asWebContents(webContents), {
      fromClipboard: false,
      duration: 100,
      outputList: [{
        fileName: 'video.mp4',
        filePath: '/tmp/video.mp4',
        mimeType: 'video/mp4',
        type: 's3'
      }]
    })
    await vi.waitFor(() => {
      expect(mocks.getVideoDuration).toHaveBeenCalledWith('/tmp/video.mp4')
    })
    webContents.isDestroyed.mockReturnValue(true)
    metadata.resolve({ duration: 5_000, size: 10 * 1024 * 1024 })

    await expect(reportPromise).resolves.toBeUndefined()
    const payloads = getTalkingDataPayloads(webContents)
    expect(payloads.map(payload => payload.EventId)).toEqual(['upload'])
    expect(webContents.send).toHaveBeenCalledWith(REGISTER_DEVICE_ID, 'device-id')
  })

  it('returns async metadata failures to the awaited reporting caller', async () => {
    const metadataError = new Error('metadata failed')
    const webContents = createWebContents()
    mocks.getVideoDuration.mockRejectedValue(metadataError)
    const { dataReportManager } = await import('../../main/utils/dataReport')

    const reportPromise = dataReportManager.reportUploadData(asWebContents(webContents), {
      fromClipboard: false,
      duration: 100,
      outputList: [{
        fileName: 'video.mp4',
        filePath: '/tmp/video.mp4',
        mimeType: 'video/mp4',
        type: 's3'
      }]
    })

    await expect(reportPromise).rejects.toBe(metadataError)
    expect(getTalkingDataPayloads(webContents).map(payload => payload.EventId)).toEqual(['upload'])
  })
})
