import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function SidebarNavButton({
  icon,
  label,
  active,
  badge,
  onClick,
  collapsed,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: string
  onClick?: () => void
  collapsed?: boolean
}) {
  const isActive = active === true

  const button = (
    <Button
      variant="ghost"
      className={cn(
        "group/sidebar-item h-10 w-full rounded-md transition-all duration-300 cursor-pointer justify-start",
        "focus-visible:ring-0 focus-visible:border-transparent",
        "focus-visible:bg-(--app-sidebar-item-hover-bg)",
        isActive
          ? "bg-(--app-sidebar-item-active-bg) text-(--app-sidebar-item-active-color) hover:bg-(--app-sidebar-item-active-bg) hover:text-(--app-sidebar-item-active-color)"
          : "text-muted-foreground hover:bg-(--app-sidebar-item-hover-bg) hover:text-(--app-sidebar-item-active-color)",
        collapsed ? "px-0 pl-3" : "px-3"
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive ? "true" : "false"}
    >
      <span
        className={cn(
          "flex items-center justify-center transition-all duration-300",
          collapsed ? "mr-0" : "mr-3"
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "text-left transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
          collapsed ? "w-0 opacity-0" : "flex-1 w-auto opacity-100",
          isActive ? "font-semibold" : "font-medium"
        )}
      >
        {label}
      </span>
      {!collapsed && badge ? (
        <Badge
          variant="secondary"
          className={cn(
            "h-5 rounded-full px-2 text-[10px] font-semibold",
            isActive
              ? "bg-(--app-sidebar-item-active-bg) text-(--app-sidebar-item-active-color)"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </Badge>
      ) : null}
    </Button>
  )

  if (!collapsed) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
