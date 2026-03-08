import {
  ChevronRight,
  Grid2X2,
  List,
  Maximize2,
  Menu,
  Search,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { MainCardHeader } from "@/components/common/main-card-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { GalleryViewMode } from "./utils"

type GalleryHeaderProps = {
  activeBreadcrumb: string
  searchValue: string
  onSearchValueChange: (value: string) => void
  onSelectAll: () => void
  onOpenInspector: () => void
  isAllSelected: boolean
  hasFilteredImages: boolean
  hasSelection: boolean
  viewMode: GalleryViewMode
  onViewModeChange: (mode: GalleryViewMode) => void
  onPreview: () => void
}

export function GalleryHeader({
  activeBreadcrumb,
  searchValue,
  onSearchValueChange,
  onSelectAll,
  onOpenInspector,
  isAllSelected,
  hasFilteredImages,
  hasSelection,
  viewMode,
  onViewModeChange,
  onPreview,
}: GalleryHeaderProps) {
  const { t } = useTranslation()

  return (
    <MainCardHeader
      className="min-h-(--app-gallery-header-height)"
      leading={
        <>
          <span>{t("GALLERY")}</span>
          <ChevronRight className="size-4" />
          <span className="text-foreground font-medium">{activeBreadcrumb}</span>
        </>
      }
      trailingClassName="flex-1"
      trailing={
        <>
          <div className="relative w-full max-w-xs">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder={t("SEARCH")}
              className="bg-muted/50 border-transparent placeholder:text-muted-foreground/70 focus:bg-background focus:border-primary/50 h-9 pl-9 text-xs transition-all"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 px-4 text-xs font-medium shadow-none bg-white dark:bg-transparent"
              >
                <Menu className="size-4" />
                <span className="hidden sm:inline">
                  {t("GALLERY_MENU")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={onSelectAll}
                disabled={!hasFilteredImages}
              >
                {isAllSelected
                  ? t("GALLERY_CLEAR_SELECTION")
                  : t("SELECT_ALL")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onOpenInspector}
                disabled={!hasSelection}
              >
                {t("GALLERY_OPEN_INSPECTOR")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="bg-card border-border flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPreview}
              title={t("GALLERY_PREVIEW")}
              aria-label={t("GALLERY_PREVIEW")}
              className="h-8 w-8 rounded-md p-0 text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onViewModeChange(GalleryViewMode.Masonry)}
              aria-pressed={viewMode === GalleryViewMode.Masonry}
              title={t("GALLERY_GRID_VIEW")}
              className={cn(
                "h-8 w-8 rounded-md p-0 transition-all duration-300",
                viewMode === GalleryViewMode.Masonry
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Grid2X2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onViewModeChange(GalleryViewMode.List)}
              aria-pressed={viewMode === GalleryViewMode.List}
              title={t("GALLERY_LIST_VIEW")}
              className={cn(
                "h-8 w-8 rounded-md p-0 transition-all duration-300",
                viewMode === GalleryViewMode.List
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <List className="size-4" />
            </Button>
          </div>
        </>
      }
    />
  )
}
