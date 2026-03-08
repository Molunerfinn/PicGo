import { MoreHorizontalIcon, SearchIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { RecentUpload } from "@/types/dashboard"
import { HistoryItem } from "./history-item"

const recentUploads: readonly RecentUpload[] = [
  { id: 1, name: "screenshot_2024.png", time: "2m ago", type: "image" },
  { id: 2, name: "avatar_design_v2.jpg", time: "1h ago", type: "image" },
  { id: 3, name: "code_snippet.png", time: "3h ago", type: "image" },
  { id: 4, name: "diagram_flow.svg", time: "5h ago", type: "image" },
  { id: 5, name: "architecture_v1.png", time: "6h ago", type: "image" },
  { id: 6, name: "banner_main.jpg", time: "8h ago", type: "image" },
  { id: 7, name: "error_log_v2.txt", time: "9h ago", type: "file" },
  { id: 8, name: "meeting_notes.md", time: "11h ago", type: "file" },
]

export function HistoryPanel({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="px-4 pb-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("HISTORY_PANEL_TITLE")}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary size-8"
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </div>
        <div className="relative">
          <Input
            placeholder={t("HISTORY_PANEL_FILTER_PLACEHOLDER")}
            className="bg-muted/50 border-transparent placeholder:text-muted-foreground/70 focus:bg-background focus:border-primary/50 h-9 pl-9 text-xs transition-all"
          />
          <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon className="size-3.5" />
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 px-4 pb-6">
          <div className="space-y-3">
            <p className="text-muted-foreground px-2 text-[10px] font-bold uppercase tracking-wider">
              {t("HISTORY_PANEL_TODAY")}
            </p>
            {recentUploads.map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-muted-foreground px-2 text-[10px] font-bold uppercase tracking-wider">
              {t("HISTORY_PANEL_YESTERDAY")}
            </p>
            <HistoryItem item={{ id: 9, name: "project_logo.png", time: "1d ago", type: "image" }} />
            <HistoryItem item={{ id: 10, name: "error_log.txt", time: "1d ago", type: "file" }} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
