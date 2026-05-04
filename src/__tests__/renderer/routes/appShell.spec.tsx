// @vitest-environment jsdom

import { createMemoryHistory } from '@tanstack/history'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useMatchRoute
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

function AppShellMock () {
  const matchRoute = useMatchRoute()
  const isActive = (to: string) => {
    return Boolean(matchRoute({ to, fuzzy: true, pending: false }))
  }

  return (
    <div>
      <button aria-current={isActive('/main/dashboard') ? 'page' : undefined}>SIDEBAR_DASHBOARD</button>
      <button aria-current={isActive('/main/providers') ? 'page' : undefined}>ALBUM_PROVIDERS</button>
      <button aria-current={isActive('/main/plugins') ? 'page' : undefined}>SIDEBAR_PLUGINS</button>
      <button aria-current={isActive('/main/settings/settings') ? 'page' : undefined}>SETTINGS</button>
      <button>MORE</button>
      <Outlet />
    </div>
  )
}

function createTestRouter (initialEntry: string) {
  const rootRoute = createRootRoute({
    component: Outlet
  })

  const mainRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/main',
    component: AppShellMock
  })

  const mainIndexRoute = createRoute({
    getParentRoute: () => mainRoute,
    path: '/',
    beforeLoad: () => {
      throw redirect({ to: '/main/dashboard', replace: true })
    }
  })

  const dashboardRoute = createRoute({
    getParentRoute: () => mainRoute,
    path: '/dashboard',
    component: () => <div title='DASHBOARD_HISTORY_PANEL_TITLE'>dashboard</div>
  })

  const providersRoute = createRoute({
    getParentRoute: () => mainRoute,
    path: '/providers',
    component: () => <div>providers</div>
  })

  const pluginsRoute = createRoute({
    getParentRoute: () => mainRoute,
    path: '/plugins',
    component: () => <div>plugins</div>
  })

  const settingsRoute = createRoute({
    getParentRoute: () => mainRoute,
    path: '/settings/settings',
    component: () => <div>settings</div>
  })

  const routeTree = rootRoute.addChildren([
    mainRoute.addChildren([
      mainIndexRoute,
      dashboardRoute,
      providersRoute,
      pluginsRoute,
      settingsRoute
    ])
  ])

  return createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialEntry]
    })
  })
}

function renderRoute (initialEntry: string) {
  const router = createTestRouter(initialEntry)

  render(<RouterProvider router={router} />)

  return router
}

describe('renderer app shell routing', () => {
  test('redirects /main/ to dashboard and renders dashboard-only history panel', async () => {
    renderRoute('/main/')

    expect(await screen.findByRole('button', { name: 'SIDEBAR_DASHBOARD' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTitle('DASHBOARD_HISTORY_PANEL_TITLE')).toBeInTheDocument()
  })

  test('drives active sidebar state from the current URL', async () => {
    renderRoute('/main/providers')

    expect(await screen.findByRole('button', { name: 'ALBUM_PROVIDERS' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'SIDEBAR_DASHBOARD' })).not.toHaveAttribute('aria-current')
  })

  test('renders the v3-style shell navigation groups on desktop routes', async () => {
    renderRoute('/main/dashboard')

    expect(await screen.findByRole('button', { name: 'SIDEBAR_PLUGINS' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SETTINGS' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MORE' })).toBeInTheDocument()
  })
})
