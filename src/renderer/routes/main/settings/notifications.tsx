import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/main/settings/notifications")({
  component: () => (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
    </main>
  ),
})

