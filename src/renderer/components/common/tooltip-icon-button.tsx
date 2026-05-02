import { type ComponentProps, type ReactNode, useState } from "react"
import { useMemoizedFn } from "ahooks"
import { LoaderCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ButtonProps = ComponentProps<typeof Button>
type TooltipContentProps = ComponentProps<typeof TooltipContent>

type TooltipIconButtonProps = {
  /** Tooltip text. Also used as aria-label if `ariaLabel` is not provided. */
  tooltip: ReactNode
  /** Icon to render. Replaced by a spinner while loading. */
  icon: ReactNode
  /** Click handler. If it returns a Promise, the button drives its own loading state. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  /** Externally controlled loading state. When provided, takes precedence over async onClick. */
  isLoading?: boolean
  /** Active/toggled state — sets `aria-pressed` and applies the active background. */
  pressed?: boolean
  /** Disable the button. */
  disabled?: boolean
  /** Override aria-label. Defaults to the tooltip when it is a string. */
  ariaLabel?: string
  /** Button size. Defaults to icon-xs to match sidebar toolbars. */
  size?: "icon-xs" | "icon-sm"
  /** Tooltip side / align passthrough. */
  tooltipSide?: TooltipContentProps["side"]
  tooltipAlign?: TooltipContentProps["align"]
  className?: string
} & Pick<ButtonProps, "type">

/**
 * Standardized ghost icon button used inside sidebar/panel toolbars.
 *
 * Visual baseline: components/main/plugins/plugin-sidebar.tsx.
 * Uses --app-sidebar-item-active-color/-bg, which the per-section CSS variables
 * (provider/plugin) all alias to, so this is visually equivalent everywhere.
 */
export function TooltipIconButton ({
  tooltip,
  icon,
  onClick,
  isLoading,
  pressed,
  disabled,
  ariaLabel,
  size = "icon-xs",
  tooltipSide,
  tooltipAlign,
  className,
  type = "button"
}: TooltipIconButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const loading = isLoading ?? internalLoading

  const handleClick = useMemoizedFn((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return
    const result = onClick(event)
    // Only drive internal loading when caller did not pass `isLoading`.
    if (isLoading === undefined && result instanceof Promise) {
      setInternalLoading(true)
      result.finally(() => {
        setInternalLoading(false)
      })
    }
  })

  const resolvedAriaLabel = ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type={type}
          variant="ghost"
          size={size}
          disabled={disabled || loading}
          aria-pressed={pressed}
          aria-label={resolvedAriaLabel}
          onClick={handleClick}
          className={cn(
            "text-muted-foreground hover:text-(--app-sidebar-item-active-color)",
            pressed ? "bg-(--app-sidebar-item-active-bg) text-(--app-sidebar-item-active-color)" : "",
            className
          )}
        >
          {loading ? <LoaderCircleIcon className="size-4 animate-spin" /> : icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} align={tooltipAlign}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
