// @vitest-environment jsdom

import { createMemoryHistory } from '@tanstack/history'
import { RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { describe, expect, test, vi } from 'vitest'
import { createAppRouter } from '@/router'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@/adapters/gallery', () => ({
  galleryAdapter: {
    getRecentUploads: vi.fn(async () => []),
    subscribeToUpdates: vi.fn(() => () => {})
  }
}))

vi.mock('electron', () => ({
  ipcRenderer: {
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    send: vi.fn()
  },
  webUtils: {
    getPathForFile: vi.fn(() => '/tmp/mock-file.png')
  }
}))

async function renderRoute (initialEntry: string) {
  const router = createAppRouter(
    createMemoryHistory({
      initialEntries: [initialEntry]
    })
  )

  render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )

  await router.load()
  return router
}

describe('renderer app shell routing', () => {
  test('redirects /main/ to dashboard and renders dashboard-only history panel', async () => {
    await renderRoute('/main/')

    expect(await screen.findByTitle('SIDEBAR_DASHBOARD')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('HISTORY_PANEL_TITLE')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('HISTORY_PANEL_FILTER_PLACEHOLDER')).toBeInTheDocument()
  })

  test('drives active sidebar state from the current URL', async () => {
    await renderRoute('/main/providers')

    expect(await screen.findByTitle('GALLERY_PROVIDERS')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTitle('SIDEBAR_DASHBOARD')).not.toHaveAttribute('aria-current')
  })

  test('renders the v3-style shell navigation groups on desktop routes', async () => {
    await renderRoute('/main/dashboard')

    expect(await screen.findByTitle('SIDEBAR_PLUGINS')).toBeInTheDocument()
    expect(screen.getByTitle('SETTINGS')).toBeInTheDocument()
    expect(screen.getByTitle('SIDEBAR_NOTIFICATIONS')).toBeInTheDocument()
    expect(screen.getByTitle('Tray')).toBeInTheDocument()
    expect(screen.getByTitle('Mini')).toBeInTheDocument()
    expect(screen.getByTitle('Rename')).toBeInTheDocument()
    expect(screen.getByTitle('Toolbox')).toBeInTheDocument()
  })
})
