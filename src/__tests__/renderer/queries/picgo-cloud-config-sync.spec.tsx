// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  IPicGoCloudConfigSyncSessionStatus,
  IPicGoCloudEncryptionMethod,
  type IPicGoCloudConfigSyncState
} from '~/universal/types/cloudConfigSync'

vi.mock('@/adapters/cloud', () => ({
  cloudAdapter: {
    getConfigSyncState: vi.fn()
  }
}))

vi.mock('@/queries/picgo-cloud', () => ({
  usePicGoCloudUserInfo: vi.fn()
}))

vi.mock('@/queries/query-client', () => ({
  rendererQueryClient: {
    setQueryData: vi.fn(),
    getQueryData: vi.fn()
  }
}))

import { cloudAdapter } from '@/adapters/cloud'
import { usePicGoCloudUserInfo } from '@/queries/picgo-cloud'
import { rendererQueryClient } from '@/queries/query-client'
import {
  PicGoCloudConfigSyncQueryKeys,
  setCloudConfigSyncStateQueryData,
  updateCloudConfigSyncStateQueryData,
  useCloudConfigSyncStateQuery
} from '@/queries/picgo-cloud-config-sync'

const SAMPLE_STATE: IPicGoCloudConfigSyncState = {
  sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE,
  encryptionMethod: IPicGoCloudEncryptionMethod.AUTO,
  lastSyncedAt: '2026-05-05T10:35:09.000Z'
}

const buildWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 }
    }
  })

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

  return { client, Wrapper }
}

describe('picgo-cloud-config-sync helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('setCloudConfigSyncStateQueryData', () => {
    it('writes state to query cache under the canonical key', () => {
      setCloudConfigSyncStateQueryData(SAMPLE_STATE)

      expect(rendererQueryClient.setQueryData).toHaveBeenCalledOnce()
      expect(rendererQueryClient.setQueryData).toHaveBeenCalledWith(
        PicGoCloudConfigSyncQueryKeys.state,
        SAMPLE_STATE
      )
    })
  })

  describe('updateCloudConfigSyncStateQueryData', () => {
    it('passes the updater function to setQueryData', () => {
      const updater = vi.fn(
        (prev: IPicGoCloudConfigSyncState | undefined): IPicGoCloudConfigSyncState => ({
          ...(prev ?? { sessionStatus: IPicGoCloudConfigSyncSessionStatus.IDLE }),
          sessionStatus: IPicGoCloudConfigSyncSessionStatus.SYNCING
        })
      )

      updateCloudConfigSyncStateQueryData(updater)

      expect(rendererQueryClient.setQueryData).toHaveBeenCalledOnce()
      const callArgs = vi.mocked(rendererQueryClient.setQueryData).mock.calls[0]
      expect(callArgs[0]).toEqual(PicGoCloudConfigSyncQueryKeys.state)
      expect(callArgs[1]).toBe(updater)
    })
  })
})

describe('useCloudConfigSyncStateQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not call adapter when user is not logged in', async () => {
    vi.mocked(usePicGoCloudUserInfo).mockReturnValue({
      userInfo: undefined,
      isPaid: false,
      isFetched: true
    } as unknown as ReturnType<typeof usePicGoCloudUserInfo>)

    const { Wrapper } = buildWrapper()
    const { result } = renderHook(() => useCloudConfigSyncStateQuery(), {
      wrapper: Wrapper
    })

    // 等一个 microtask 让 react-query 有机会 schedule fetch
    await Promise.resolve()
    expect(cloudAdapter.getConfigSyncState).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns parsed state when adapter resolves with success', async () => {
    vi.mocked(usePicGoCloudUserInfo).mockReturnValue({
      userInfo: { user: 'tester', plan: 1 },
      isPaid: true,
      isFetched: true
    } as unknown as ReturnType<typeof usePicGoCloudUserInfo>)

    vi.mocked(cloudAdapter.getConfigSyncState).mockResolvedValue({
      success: true,
      data: SAMPLE_STATE
    } as unknown as Awaited<ReturnType<typeof cloudAdapter.getConfigSyncState>>)

    const { Wrapper } = buildWrapper()
    const { result } = renderHook(() => useCloudConfigSyncStateQuery(), {
      wrapper: Wrapper
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(cloudAdapter.getConfigSyncState).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual(SAMPLE_STATE)
  })

  it('surfaces error state when adapter resolves with success: false', async () => {
    vi.mocked(usePicGoCloudUserInfo).mockReturnValue({
      userInfo: { user: 'tester', plan: 0 },
      isPaid: false,
      isFetched: true
    } as unknown as ReturnType<typeof usePicGoCloudUserInfo>)

    vi.mocked(cloudAdapter.getConfigSyncState).mockResolvedValue({
      success: false,
      error: 'boom'
    } as unknown as Awaited<ReturnType<typeof cloudAdapter.getConfigSyncState>>)

    const { Wrapper } = buildWrapper()
    const { result } = renderHook(() => useCloudConfigSyncStateQuery(), {
      wrapper: Wrapper
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('boom')
  })
})
