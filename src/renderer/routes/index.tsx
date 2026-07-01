import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: () => <div className="h-screen w-full bg-background text-foreground" />,
})

