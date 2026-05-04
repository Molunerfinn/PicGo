import { QueryClient } from '@tanstack/react-query'

export const rendererQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
})
