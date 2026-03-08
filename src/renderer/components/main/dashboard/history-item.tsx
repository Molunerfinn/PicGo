import { ClockIcon, CopyIcon, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RecentUpload } from "@/types/dashboard"

export function HistoryItem({ item }: { item: RecentUpload }) {
  return (
    <div className="group hover:bg-primary/10 flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors">
      <div className="bg-muted border-border/50 group-hover:border-primary/20 group-hover:bg-white/50 flex size-10 flex-shrink-0 items-center justify-center rounded-lg border transition-colors">
        <ImageIcon className="text-muted-foreground/70 group-hover:text-primary size-4 transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-foreground/90 group-hover:text-primary truncate text-sm font-medium transition-colors">
          {item.name}
        </h4>
        <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
          <ClockIcon className="size-2.5" />
          <span>{item.time}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-primary opacity-0 transition-opacity group-hover:opacity-100"
      >
        <CopyIcon className="size-3" />
      </Button>
    </div>
  )
}
