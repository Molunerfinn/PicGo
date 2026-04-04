import { type CSSProperties, useEffect, useState } from "react"
import { Outlet } from "@tanstack/react-router"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppReloadBar } from "@/components/common/app-reload-bar"
import { TitleBar } from "@/components/common/title-bar"
import { isMacOS } from "@/utils/bridge"
import { PicGoAppSidebar } from "./picgo-app-sidebar"
import { useAppearanceTheme } from "./hooks/use-appearance-theme"

export function PicGoMainLayout() {
  const isMac = isMacOS()
  const { isDark, toggleTheme } = useAppearanceTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse on narrow screens, but never auto-expand on resize.
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans text-foreground">
      <TitleBar isMac={isMac} />

      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        style={
          {
            "--sidebar-width": "var(--app-sidebar-width)",
            "--sidebar-width-icon": "var(--app-sidebar-width-icon)",
          } as CSSProperties
        }
        className="relative flex-1 min-h-0 w-full gap-4 p-4 pt-0 transition-colors duration-300"
      >
        <PicGoAppSidebar
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        <div className="flex h-full min-h-0 min-w-0 flex-1 gap-4">
          <Outlet />
        </div>

        <AppReloadBar />
      </SidebarProvider>
    </div>
  )
}
