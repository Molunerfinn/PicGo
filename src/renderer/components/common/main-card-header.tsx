import * as React from "react"

import { cn } from "@/lib/utils"

interface MainCardHeaderProps extends React.ComponentProps<"header"> {
  leading: React.ReactNode
  trailing?: React.ReactNode
  leadingClassName?: string
  trailingClassName?: string
}

export function MainCardHeader({
  leading,
  trailing,
  className,
  leadingClassName,
  trailingClassName,
  ...props
}: MainCardHeaderProps) {
  return (
    <header
      className={cn(
        "border-border/60 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-5 py-3",
        className
      )}
      {...props}
    >
      <div className={cn("flex min-w-0 items-center gap-2 text-sm", leadingClassName)}>
        {leading}
      </div>
      {trailing ? (
        <div
          className={cn(
            "flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto",
            trailingClassName
          )}
        >
          {trailing}
        </div>
      ) : null}
    </header>
  )
}
