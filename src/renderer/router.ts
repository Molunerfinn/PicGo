import { createHashHistory, createMemoryHistory, type RouterHistory } from '@tanstack/history'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function createDefaultHistory (): RouterHistory {
  if (typeof window === 'undefined') {
    return createMemoryHistory({
      initialEntries: ['/main/dashboard']
    })
  }

  return createHashHistory()
}

export function createAppRouter (history: RouterHistory = createDefaultHistory()) {
  return createRouter({
    routeTree,
    history
  })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
