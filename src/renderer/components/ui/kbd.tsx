import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-6 items-center rounded-md border border-border px-2 text-[11px] font-medium",
        className
      )}
      {...props}
    />
  )
}

