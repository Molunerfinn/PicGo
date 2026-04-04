import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IConfig } from 'picgo'
import { getConfig, getPicBeds } from '@/utils/dataSender'
import {
  appActions,
  PicGoCloudLoginStatusValues,
  PicGoCloudRequestStatusValues,
  useStore
} from '@/store'

vi.mock('@/utils/dataSender', () => {
  return {
    getConfig: vi.fn(),
    getPicBeds: vi.fn(),
    saveConfig: vi.fn()
  }
})

const resetStore = () => {
  useStore.setState({
    defaultPicBed: 'smms',
    appConfig: null,
    picBeds: [],
    picgoCloud: {
      userInfo: undefined,
      userInfoStatus: PicGoCloudRequestStatusValues.Idle,
      userInfoError: null,
      loginStatus: PicGoCloudLoginStatusValues.Idle,
      loginError: null,
      hasAgreedToTermsAndPrivacy: false
    }
  })
}

describe('renderer/store appConfig', () => {
  const getConfigMock = vi.mocked(getConfig)
  const getPicBedsMock = vi.mocked(getPicBeds)

  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
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

    await appActions.refreshAppConfig()

    const nextState = useStore.getState()
    expect(nextState.appConfig?.picBed.uploader).toBe('github')
    expect(nextState.appConfig?.picBed.current).toBe('smms')
    expect(nextState.appConfig?.settings.autoCopyUrl).toBe(true)
    expect(nextState.defaultPicBed).toBe('github')
  })

  it('refreshPicBeds updates picBeds', async () => {
    const picBeds: IPicBedType[] = [
      { type: 'smms', name: 'SM.MS', visible: true },
      { type: 'github', name: 'GitHub', visible: true }
    ]
    getPicBedsMock.mockResolvedValue(picBeds)

    await appActions.refreshPicBeds()

    expect(useStore.getState().picBeds).toEqual(picBeds)
  })
})
