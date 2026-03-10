import {
  ChevronRight,
  Grid2X2,
  List,
  Maximize2,
  Menu,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { MainCardHeader } from "@/components/common/main-card-header"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { GalleryViewMode } from "./utils"

type GalleryHeaderProps = {
  activeBreadcrumb: string
  masonryColumnCount: number
  searchValue: string
  onSearchValueChange: (value: string) => void
  onMasonryColumnCountChange: (value: number) => Promise<void>
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
  masonryColumnCount,
  searchValue,
  onSearchValueChange,
  onMasonryColumnCountChange,
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
  const sliderValue = 11 - masonryColumnCount

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
          {viewMode === GalleryViewMode.Masonry ? (
            <div className="flex shrink-0 items-center px-1 py-1">
              <Slider
                min={1}
                max={10}
                step={1}
                value={sliderValue}
                aria-label={t("GALLERY_GRID_VIEW")}
                className="w-28"
                onValueChange={async (value) => {
                  const resolvedValue = Array.isArray(value) ? value[0] : value
                  const nextValue = 11 - resolvedValue
                  await onMasonryColumnCountChange(nextValue)
                }}
              />
            </div>
          ) : null}

          <div className="w-full max-w-xs">
            <SearchInput
              value={searchValue}
              onValueChange={onSearchValueChange}
              placeholder={t("SEARCH")}
              ariaLabel={t("SEARCH")}
              clearLabel={t("GALLERY_CLEAR_SELECTION")}
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
