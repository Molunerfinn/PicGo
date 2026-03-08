import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/main/settings/")({
  beforeLoad: () => {
    throw redirect({ to: "/main/settings/settings", replace: true })
  },
})
