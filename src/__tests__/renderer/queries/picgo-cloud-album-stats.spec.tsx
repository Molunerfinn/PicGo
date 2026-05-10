// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CloudAlbumStatsResponse } from '~/universal/types/cloudAlbum'

vi.mock('@/adapters/cloud-album', () => ({
  cloudAlbumAdapter: {
    getStats: vi.fn()
  }
}))

vi.mock('@/queries/query-client', () => ({
  rendererQueryClient: {
    invalidateQueries: vi.fn()
  }
}))

import { cloudAlbumAdapter } from '@/adapters/cloud-album'
import { rendererQueryClient } from '@/queries/query-client'
import {
  invalidateCloudAlbumStatsQuery,
  PicGoCloudAlbumStatsQueryKeys,
  useCloudAlbumStatsQuery
} from '@/queries/picgo-cloud-album-stats'

const SAMPLE_STATS: CloudAlbumStatsResponse = {
  total: 12,
  types: [
    { type: 'picgo-cloud', count: 8 },
    { type: 'github', count: 4 }
  ]
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

describe('useCloudAlbumStatsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed stats when adapter resolves with success', async () => {
    vi.mocked(cloudAlbumAdapter.getStats).mockResolvedValue({
      success: true,
      data: SAMPLE_STATS
    } as unknown as Awaited<ReturnType<typeof cloudAlbumAdapter.getStats>>)

    const { Wrapper } = buildWrapper()
    const { result } = renderHook(() => useCloudAlbumStatsQuery(), {
      wrapper: Wrapper
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(cloudAlbumAdapter.getStats).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual(SAMPLE_STATS)
  })

  it('surfaces error state when adapter resolves with success: false', async () => {
    vi.mocked(cloudAlbumAdapter.getStats).mockResolvedValue({
      success: false,
      error: 'stats-fetch-failed'
    } as unknown as Awaited<ReturnType<typeof cloudAlbumAdapter.getStats>>)

    const { Wrapper } = buildWrapper()
    const { result } = renderHook(() => useCloudAlbumStatsQuery(), {
      wrapper: Wrapper
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('stats-fetch-failed')
  })

  it('does not call adapter when enabled is false', async () => {
    const { Wrapper } = buildWrapper()
    const { result } = renderHook(() => useCloudAlbumStatsQuery({ enabled: false }), {
      wrapper: Wrapper
    })

    // give react-query a microtask to schedule (it shouldn't)
    await Promise.resolve()
    expect(cloudAlbumAdapter.getStats).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('calls adapter when enabled is omitted (default true)', async () => {
    vi.mocked(cloudAlbumAdapter.getStats).mockResolvedValue({
      success: true,
      data: SAMPLE_STATS
    } as unknown as Awaited<ReturnType<typeof cloudAlbumAdapter.getStats>>)

    const { Wrapper } = buildWrapper()
    renderHook(() => useCloudAlbumStatsQuery(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(cloudAlbumAdapter.getStats).toHaveBeenCalledOnce()
    })
  })
})

describe('invalidateCloudAlbumStatsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates the canonical stats query key', async () => {
    vi.mocked(rendererQueryClient.invalidateQueries).mockResolvedValue(undefined)

    await invalidateCloudAlbumStatsQuery()

    expect(rendererQueryClient.invalidateQueries).toHaveBeenCalledOnce()
    expect(rendererQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: PicGoCloudAlbumStatsQueryKeys.stats
    })
  })
})
