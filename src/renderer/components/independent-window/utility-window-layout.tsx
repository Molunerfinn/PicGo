import { type CSSProperties, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  type UtilityWindowPage,
  UTILITY_WINDOW_BASELINES,
} from "./constants"

interface UtilityWindowLayoutProps {
  page: UtilityWindowPage
  children: ReactNode
  className?: string
  shellClassName?: string
}

function buildUtilityWindowLayoutStyle(
  page: UtilityWindowPage
): CSSProperties {
  const baseline = UTILITY_WINDOW_BASELINES[page]

  return {
    "--app-utility-shell-width": `${baseline.width}px`,
    "--app-utility-shell-height": `${baseline.height}px`,
  } as CSSProperties
}

export function UtilityWindowLayout({
  page,
  children,
  className,
  shellClassName,
}: UtilityWindowLayoutProps) {
  return (
    <main
      className={cn("h-dvh w-full overflow-hidden bg-background", className)}
      style={buildUtilityWindowLayoutStyle(page)}
      data-testid={`utility-window-${page}`}
    >
      <div className="mx-auto flex min-h-dvh w-full justify-center">
        <section
          className={cn(
            "w-full max-w-(--app-utility-shell-width) min-h-(--app-utility-shell-height)",
            shellClassName
          )}
          data-testid={`utility-window-shell-${page}`}
        >
          {children}
        </section>
      </div>
    </main>
  )
}
