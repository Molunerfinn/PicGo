import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

type CheckboxCheckedState = boolean | "indeterminate"

function Checkbox({
  className,
  checked,
  defaultChecked,
  indeterminate,
  onCheckedChange,
  ...props
}: Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Root>,
  "checked" | "defaultChecked" | "indeterminate" | "onCheckedChange"
> & {
  checked?: CheckboxCheckedState
  defaultChecked?: CheckboxCheckedState
  indeterminate?: boolean
  onCheckedChange?: (checked: CheckboxCheckedState) => void
}) {
  const isIndeterminate =
    indeterminate ||
    checked === "indeterminate" ||
    defaultChecked === "indeterminate"

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      render={<button type="button" />}
      nativeButton={true}
      checked={checked === "indeterminate" ? false : checked}
      defaultChecked={
        defaultChecked === "indeterminate" ? false : defaultChecked
      }
      indeterminate={isIndeterminate}
      onCheckedChange={(nextChecked) => onCheckedChange?.(nextChecked)}
      className={cn(
        "border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex size-4 items-center justify-center rounded-[4px] border shadow-xs transition-shadow group-has-disabled/field:opacity-50 focus-visible:ring-[3px] aria-invalid:ring-[3px] peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="[&>svg]:size-3.5 grid place-content-center text-current transition-none"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
