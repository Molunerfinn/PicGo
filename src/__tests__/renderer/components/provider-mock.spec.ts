import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { providerMockApi } from '@/components/main/providers/provider-mock'
import { PICGO_CLOUD_UPLOADER_TYPE } from '#/utils/static'

async function settleMockRequest<T> (request: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync()
  return request
}

describe('provider mock defaults', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    await settleMockRequest(providerMockApi.resetMockState())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses PicGo Cloud by default while retaining SM.MS as a provider', async () => {
    const snapshot = await settleMockRequest(providerMockApi.getProviderAppState())

    expect(snapshot.appConfig.picBed.uploader).toBe(PICGO_CLOUD_UPLOADER_TYPE)
    expect(snapshot.appConfig.picBed.current).toBe(PICGO_CLOUD_UPLOADER_TYPE)
    expect(snapshot.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: PICGO_CLOUD_UPLOADER_TYPE,
        isDefaultUploader: true
      }),
      expect.objectContaining({
        id: 'smms',
        isDefaultUploader: false
      })
    ]))
  })

  it('falls back to PicGo Cloud after removing the active external uploader', async () => {
    const externalUploaderId = 'external-uploader'

    await settleMockRequest(providerMockApi.upsertExternalUploader({
      id: externalUploaderId,
      name: 'External uploader',
      schema: [],
      configState: {
        defaultId: '',
        configList: []
      }
    }))
    await settleMockRequest(providerMockApi.setDefaultUploader(externalUploaderId))

    const result = await settleMockRequest(providerMockApi.removeUploader(externalUploaderId))

    expect(result).toEqual({
      removed: true,
      fallbackUploaderId: PICGO_CLOUD_UPLOADER_TYPE
    })
    expect(await settleMockRequest(providerMockApi.getFirstAvailableUploaderId())).toBe(PICGO_CLOUD_UPLOADER_TYPE)
  })
})
