import { createHashHistory } from "@tanstack/history"
import { createRouter, RouterProvider } from "@tanstack/react-router"

import { routeTree } from "./routeTree.gen"
import { Toaster } from "@/components/ui/sonner"

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
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
