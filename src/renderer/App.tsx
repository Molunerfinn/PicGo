import { createHashHistory } from "@tanstack/history"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"

import { routeTree } from "./routeTree.gen"
import { GlobalAppearanceSync } from "@/components/common/global-appearance-sync"
import { PicGoCloudUserInfoSync } from "@/components/common/picgo-cloud-user-info-sync"
import { RendererRuntimeBridge } from "@/components/common/renderer-runtime-bridge"
import { RendererStoreHydrator } from "@/components/common/renderer-store-hydrator"
import { Toaster } from "@/components/ui/sonner"
import { rendererQueryClient } from "@/queries/query-client"

const router = createRouter({
  routeTree,
  history: createHashHistory(),
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return (
    <QueryClientProvider client={rendererQueryClient}>
      <RendererStoreHydrator />
      <RendererRuntimeBridge />
      <PicGoCloudUserInfoSync />
      <GlobalAppearanceSync />
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

export default App
