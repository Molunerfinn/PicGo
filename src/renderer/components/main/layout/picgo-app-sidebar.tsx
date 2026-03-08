import {
  BellIcon,
  CloudIcon,
  ImageIcon,
  LayoutIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PuzzleIcon,
  SettingsIcon,
  SunIcon,
  WrenchIcon,
} from "lucide-react"
import { useMatchRoute, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { cn } from "@/lib/utils"
import { SidebarNavButton } from "./sidebar-nav-button"

const SIDEBAR_ICON_CLASSNAME = "size-[18px]"

export function PicGoAppSidebar({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean
  onToggleTheme: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { state, setOpen } = useSidebar()
  const collapsed = state === "collapsed"
  const isDevMode = import.meta.env.DEV

  const matchActive = (to: string) =>
    !!matchRoute({ to, fuzzy: true, pending: false })

  const isDashboardActive = matchActive("/main/dashboard")
  const isGalleryActive = matchActive("/main/gallery")
  const isProviderActive = matchActive("/main/providers")
  const isPluginsActive = matchActive("/main/plugins")
  const isSettingsActive =
    matchActive("/main/settings/settings") ||
    matchActive("/main/settings/shortcuts") ||
    matchActive("/main/settings/url-rewrite")
  const isNotificationsActive = matchActive("/main/settings/notifications")
  const isTrayActive = matchActive("/tray")
  const isMiniActive = matchActive("/mini")
  const isRenameActive = matchActive("/rename")
  const isToolboxActive = matchActive("/toolbox")

  return (
    <Sidebar
      collapsible="icon"
      className="absolute left-4 top-0 bottom-4 h-auto overflow-hidden rounded-xl border-sidebar-border backdrop-blur-xl border"
    >
      <div className="h-full flex flex-col transition-all duration-300">
        <div className="p-4 pb-8">
          <div
            className={cn(
              "flex items-center transition-all duration-300 justify-between px-2"
            )}
          >
            <div
              className={cn(
                "flex items-center transition-all duration-300",
                collapsed ? "cursor-pointer hover:opacity-80" : "gap-3"
              )}
              onClick={() => collapsed && setOpen(true)}
              title={collapsed ? t("SIDEBAR_EXPAND") : undefined}
              role={collapsed ? "button" : undefined}
            >
              <img
                src="https://pics.molunerfinn.com/doc/picgo-logo.png"
                alt="PicGo Logo"
                className="size-8 object-contain"
              />
              <span
                className={cn(
                  'text-xl font-bold tracking-tight transition-all duration-300 whitespace-nowrap overflow-hidden origin-left',
                  collapsed ? 'w-0 opacity-0 scale-90' : 'w-auto opacity-100 scale-100'
                )}
              >
                PicGo
              </span>
            </div>

            {!collapsed ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <PanelLeftCloseIcon className={SIDEBAR_ICON_CLASSNAME} />
                <span className="sr-only">{t("SIDEBAR_COLLAPSE")}</span>
              </Button>
            ) : null}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4">
            <nav className="space-y-1">
              <SidebarNavButton
                icon={<LayoutIcon className={SIDEBAR_ICON_CLASSNAME} />}
                label={t("SIDEBAR_DASHBOARD")}
                active={isDashboardActive}
                onClick={() => navigate({ to: "/main/dashboard" })}
                collapsed={collapsed}
              />
              <SidebarNavButton
                icon={<ImageIcon className={SIDEBAR_ICON_CLASSNAME} />}
                label={t("GALLERY")}
                active={isGalleryActive}
                onClick={() => navigate({ to: "/main/gallery" })}
                collapsed={collapsed}
              />
              <SidebarNavButton
                icon={<CloudIcon className={SIDEBAR_ICON_CLASSNAME} />}
                label={t("GALLERY_PROVIDERS")}
                active={isProviderActive}
                onClick={() => navigate({ to: "/main/providers" })}
                collapsed={collapsed}
              />
              <SidebarNavButton
                icon={<PuzzleIcon className={SIDEBAR_ICON_CLASSNAME} />}
                label={t("SIDEBAR_PLUGINS")}
                active={isPluginsActive}
                onClick={() => navigate({ to: "/main/plugins" })}
                collapsed={collapsed}
              />
            </nav>

            <div className="mt-8">
              {!collapsed ? (
                <p className="text-muted-foreground animate-in fade-in mb-3 px-4 text-xs font-semibold uppercase tracking-wider">
                  {t("SIDEBAR_SYSTEM")}
                </p>
              ) : (
                <div className="bg-border mx-2 my-4 h-px" />
              )}

              <nav className="space-y-1">
                <SidebarNavButton
                  icon={<SettingsIcon className={SIDEBAR_ICON_CLASSNAME} />}
                  label={t("SETTINGS")}
                  active={isSettingsActive}
                  onClick={() => navigate({ to: "/main/settings/settings" })}
                  collapsed={collapsed}
                />
                <SidebarNavButton
                  icon={<BellIcon className={SIDEBAR_ICON_CLASSNAME} />}
                  label={t("SIDEBAR_NOTIFICATIONS")}
                  badge="2"
                  active={isNotificationsActive}
                  onClick={() => navigate({ to: "/main/settings/notifications" })}
                  collapsed={collapsed}
                />
              </nav>
            </div>

            {isDevMode ? (
              <div className="mt-8">
                {!collapsed ? (
                  <p className="text-muted-foreground animate-in fade-in mb-3 px-4 text-xs font-semibold uppercase tracking-wider">
                    Dev
                  </p>
                ) : (
                  <div className="bg-border mx-2 my-4 h-px" />
                )}

                <nav className="space-y-1">
                  <SidebarNavButton
                    icon={<LayoutIcon className={SIDEBAR_ICON_CLASSNAME} />}
                    label="Tray"
                    active={isTrayActive}
                    onClick={() => navigate({ to: "/tray" })}
                    collapsed={collapsed}
                  />
                  <SidebarNavButton
                    icon={<ImageIcon className={SIDEBAR_ICON_CLASSNAME} />}
                    label="Mini"
                    active={isMiniActive}
                    onClick={() => navigate({ to: "/mini" })}
                    collapsed={collapsed}
                  />
                  <SidebarNavButton
                    icon={<SettingsIcon className={SIDEBAR_ICON_CLASSNAME} />}
                    label="Rename"
                    active={isRenameActive}
                    onClick={() => navigate({ to: "/rename" })}
                    collapsed={collapsed}
                  />
                  <SidebarNavButton
                    icon={<WrenchIcon className={SIDEBAR_ICON_CLASSNAME} />}
                    label="Toolbox"
                    active={isToolboxActive}
                    onClick={() => navigate({ to: "/toolbox" })}
                    collapsed={collapsed}
                  />
                </nav>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <div className="p-4">
          <Card
            className={cn(
              "bg-muted/30 hover:bg-muted/50 group cursor-pointer overflow-hidden border border-border shadow-none transition-colors",
              collapsed ? "border-none bg-transparent py-0" : "py-0"
            )}
          >
            <CardContent
              className={cn(
                "flex items-center gap-3 p-3",
                collapsed ? "justify-center p-0" : ""
              )}
            >
              <Avatar className="border-border group-hover:border-primary/50 size-9 border transition-colors">
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>MF</AvatarFallback>
              </Avatar>

              {!collapsed ? (
                <>
                  <div className="animate-in fade-in min-w-0 flex-1 duration-300">
                    <p className="group-hover:text-primary truncate text-sm font-bold transition-colors">
                      Molunerfinn
                    </p>
                    <p className="text-muted-foreground truncate text-xs">Pro Plan</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggleTheme()
                    }}
                    className="text-muted-foreground hover:text-primary rounded-full"
                  >
                    {isDark ? (
                      <SunIcon className={SIDEBAR_ICON_CLASSNAME} />
                    ) : (
                      <MoonIcon className={SIDEBAR_ICON_CLASSNAME} />
                    )}
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  )
}
