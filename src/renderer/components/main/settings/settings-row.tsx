import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SettingsRowProps {
  title: string
  description?: string
  hidden?: boolean
  control: ReactNode
  titleClassName?: string
  titleContainerClassName?: string
  controlContainerClassName?: string
}

export function SettingsRow({
  title,
  description,
  hidden,
  control,
  titleClassName,
  titleContainerClassName,
  controlContainerClassName,
}: SettingsRowProps) {
  if (hidden) {
    return null
  }

  return (
    <div className="border-border/60 flex flex-wrap items-start justify-between gap-3 border-b py-4 last:border-b-0">
      <div className={cn("min-w-0 flex-1", titleContainerClassName)}>
        <div className={cn("text-text-body text-sm font-medium", titleClassName)}>
          {title}
        </div>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        ) : null}
      </div>
      <div
        className={cn(
          "flex w-full min-w-0 flex-wrap justify-end gap-2 sm:w-auto",
          controlContainerClassName
        )}
      >
        {control}
      </div>
    </div>
  )
}
