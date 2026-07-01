// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AlbumSource } from '~/universal/types/cloudAlbum'
import { NavType } from '@/components/main/album/utils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@/adapters/cloud-album', () => ({
  cloudAlbumAdapter: {
    getStats: vi.fn()
  }
}))

vi.mock('@/components/common/album-source-switcher', () => ({
  AlbumSourceSwitcher: () => null
}))

vi.mock('@/components/common/cloud-feature-highlights', () => ({
  CloudFeatureHighlights: () => null
}))

vi.mock('@/components/common/cloud-refresh-button', () => ({
  CloudRefreshButton: () => null
}))

vi.mock('@/components/main/album/cloud-loading', () => ({
  CloudSidebarSkeleton: () => <div data-testid="cloud-sidebar-skeleton" />
}))

vi.mock('@/store', () => ({
  useAppStore: {
    use: {
      picBeds: () => [
        { type: 'picgo-cloud', name: 'PicGo Cloud', visible: true }
      ]
    }
  }
}))

import { cloudAlbumAdapter } from '@/adapters/cloud-album'
import { AlbumSidebar } from '@/components/main/album/album-sidebar'

const buildWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  })
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, Wrapper }
}

const baseProps = {
  images: [],
  providers: [],
  navContext: { type: NavType.All, value: 'all' },
  albumSource: AlbumSource.CLOUD,
  isCloudAvailable: true,
  onFilterChange: () => {}
}

describe('AlbumSidebar (cloud mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders All Photos count and provider count from stats query', async () => {
    vi.mocked(cloudAlbumAdapter.getStats).mockResolvedValue({
      success: true,
      data: { total: 7, types: [{ type: 'picgo-cloud', count: 7 }] }
    } as unknown as Awaited<ReturnType<typeof cloudAlbumAdapter.getStats>>)

    const { Wrapper } = buildWrapper()
    render(<AlbumSidebar {...baseProps} />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('ALBUM_ALL_PHOTOS')).toBeTruthy()
      expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('PicGo Cloud')).toBeTruthy()
    })
    expect(cloudAlbumAdapter.getStats).toHaveBeenCalledOnce()
  })

  it('shows "—" for All Photos count when stats query errors out', async () => {
    vi.mocked(cloudAlbumAdapter.getStats).mockResolvedValue({
      success: false,
      error: 'boom'
    } as unknown as Awaited<ReturnType<typeof cloudAlbumAdapter.getStats>>)

    const { Wrapper } = buildWrapper()
    render(<AlbumSidebar {...baseProps} />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('—')).toBeTruthy()
    })
  })

  it('does not call stats adapter when isCloudAvailable=false', async () => {
    const { Wrapper } = buildWrapper()
    render(
      <AlbumSidebar {...baseProps} isCloudAvailable={false} />,
      { wrapper: Wrapper }
    )

    // give react-query a microtask
    await Promise.resolve()
    expect(cloudAlbumAdapter.getStats).not.toHaveBeenCalled()
  })

  it('does not call stats adapter when albumSource is LOCAL', async () => {
    const { Wrapper } = buildWrapper()
    render(
      <AlbumSidebar {...baseProps} albumSource={AlbumSource.LOCAL} />,
      { wrapper: Wrapper }
    )

    await Promise.resolve()
    expect(cloudAlbumAdapter.getStats).not.toHaveBeenCalled()
  })
})
