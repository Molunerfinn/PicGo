import * as React from "react"
import { Slot } from "@/lib/slot"

import { cn } from "@/lib/utils"

interface AppMainCardProps extends React.ComponentProps<"div"> {
  asChild?: boolean
}

export function AppMainCard({
  asChild = false,
  className,
  ...props
}: AppMainCardProps) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      className={cn(
        "bg-(--app-panel-bg) border-(--app-panel-border) relative flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border backdrop-blur-xl",
        className
      )}
      {...props}
    />
  )
}
