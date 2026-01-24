import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import type { IConfig } from 'picgo'
import { getConfig, getPicBeds } from '@/utils/dataSender'
import { store, storeKey, type IStore } from '@/store'

vi.mock('@/utils/dataSender', () => {
  return {
    getConfig: vi.fn(),
    getPicBeds: vi.fn(),
    saveConfig: vi.fn()
  }
})

const buildStore = (): IStore => {
  const app = createApp({})
  store.install(app)
  return app._context.provides[storeKey as symbol] as IStore
}

describe('renderer/store appConfig', () => {
  const getConfigMock = vi.mocked(getConfig)
  const getPicBedsMock = vi.mocked(getPicBeds)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refreshAppConfig updates appConfig and defaultPicBed', async () => {
    const config: IConfig = {
      picBed: {
        uploader: 'github',
        current: 'smms'
      },
      picgoPlugins: {}
    }
    getConfigMock.mockResolvedValue(config)

    const storeInstance = buildStore()
    await storeInstance.refreshAppConfig()

    expect(storeInstance.state.appConfig).toStrictEqual(config)
    expect(storeInstance.state.defaultPicBed).toBe('github')
  })

  it('refreshPicBeds updates picBeds', async () => {
    const picBeds: IPicBedType[] = [
      { type: 'smms', name: 'SM.MS', visible: true },
      { type: 'github', name: 'GitHub', visible: true }
    ]
    getPicBedsMock.mockResolvedValue(picBeds)

    const storeInstance = buildStore()
    await storeInstance.refreshPicBeds()

    expect(storeInstance.state.picBeds).toEqual(picBeds)
  })
})
