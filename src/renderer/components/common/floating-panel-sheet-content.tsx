import * as React from "react"

import { SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function FloatingPanelSheetContent({
  className,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side={side}
      className={cn("rounded-l-xl rounded-r-none border gap-0 p-0", className)}
      {...props}
    />
  )
}
