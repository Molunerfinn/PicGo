import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IConfig } from 'picgo'
import { getConfig, getPicBeds } from '@/utils/dataSender'
import { initialAppStoreState } from '@/store/app-store'
import {
  appActions,
  PicGoCloudLoginStatusValues,
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
    defaultPicBed: initialAppStoreState.defaultPicBed,
    appConfig: null,
    picBeds: [],
    picgoCloud: {
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

  it.each([
    { uploader: '', current: undefined, expected: 'picgo-cloud' },
    { uploader: '', current: '', expected: 'picgo-cloud' },
    { uploader: '', current: 'smms', expected: 'smms' },
    { uploader: 'smms', current: 'picgo-cloud', expected: 'smms' }
  ])('hydrates the uploader as $expected for uploader=$uploader current=$current', async ({ uploader, current, expected }) => {
    const config: IConfig = { picBed: { uploader, current }, picgoPlugins: {} }
    getConfigMock.mockResolvedValue(config)
    getPicBedsMock.mockResolvedValue([])

    await appActions.hydrateAppState()

    expect(useStore.getState().defaultPicBed).toBe(expected)
    expect(config.picBed).toEqual({ uploader, current })
  })

  it('uses PicGo Cloud while configuration is unavailable', async () => {
    expect(useStore.getState().defaultPicBed).toBe('picgo-cloud')
    useStore.setState({ defaultPicBed: 'github' })
    getConfigMock.mockResolvedValue(undefined)

    await appActions.refreshAppConfig()

    expect(useStore.getState().defaultPicBed).toBe('picgo-cloud')
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
