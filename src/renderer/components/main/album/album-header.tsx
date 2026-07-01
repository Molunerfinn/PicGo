import {
  ChevronRight,
  Grid2X2,
  List,
  Maximize2,
  MoreHorizontal,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { albumStoreActions, useAlbumStore } from "@/store"
import { AlbumViewMode } from "./utils"

type AlbumHeaderProps = {
  activeBreadcrumb: string
  searchValue: string
  onSearchValueChange: (value: string) => void
  onSelectAll: () => void
  onOpenInspector: () => void
  isAllSelected: boolean
  hasFilteredImages: boolean
  hasSelection: boolean
  onPreview: () => void
}

export function AlbumHeader({
  activeBreadcrumb,
  searchValue,
  onSearchValueChange,
  onSelectAll,
  onOpenInspector,
  isAllSelected,
  hasFilteredImages,
  hasSelection,
  onPreview,
}: AlbumHeaderProps) {
  const { t } = useTranslation()
  const viewMode = useAlbumStore.use.viewMode()
  const masonryColumnCount = useAlbumStore.use.masonryColumnCount()
  const sliderValue = 11 - masonryColumnCount

  return (
    <MainCardHeader
      className="min-h-(--app-gallery-header-height)"
      leading={
        <>
          <span>{t("ALBUM")}</span>
          <ChevronRight className="size-4" />
          <span className="text-foreground font-medium">{activeBreadcrumb}</span>
        </>
      }
      trailingClassName="flex-1"
      trailing={
        <>
          {viewMode === AlbumViewMode.Masonry ? (
            <div className="flex shrink-0 items-center px-1 py-1">
              <Slider
                min={1}
                max={10}
                step={1}
                value={sliderValue}
                aria-label={t("ALBUM_GRID_VIEW")}
                className="w-28"
                onValueChange={async (value) => {
                  const resolvedValue = Array.isArray(value) ? value[0] : value
                  const nextValue = 11 - resolvedValue
                  await albumStoreActions.setMasonryColumnCount(nextValue)
                }}
              />
            </div>
          ) : null}

          <div className="w-full max-w-[14rem]">
            <SearchInput
              value={searchValue}
              onValueChange={onSearchValueChange}
              placeholder={t("SEARCH")}
              ariaLabel={t("SEARCH")}
              clearLabel={t("ALBUM_CLEAR_SELECTION")}
            />
          </div>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("ALBUM_MENU")}
                    className="h-9 w-9 p-0 shadow-none bg-white dark:bg-transparent"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("ALBUM_MENU")}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={onSelectAll}
                disabled={!hasFilteredImages}
              >
                {isAllSelected
                  ? t("ALBUM_CLEAR_SELECTION")
                  : t("SELECT_ALL")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onOpenInspector}
                disabled={!hasSelection}
              >
                {t("ALBUM_OPEN_INSPECTOR")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="bg-card border-border flex items-center gap-1 rounded-lg border p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPreview}
                  aria-label={t("ALBUM_PREVIEW")}
                  className="h-8 w-8 rounded-md p-0 text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground"
                >
                  <Maximize2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("ALBUM_PREVIEW")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => albumStoreActions.setViewMode(AlbumViewMode.Masonry)}
                  aria-pressed={viewMode === AlbumViewMode.Masonry}
                  aria-label={t("ALBUM_GRID_VIEW")}
                  className={cn(
                    "h-8 w-8 rounded-md p-0 transition-all duration-300",
                    viewMode === AlbumViewMode.Masonry
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Grid2X2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("ALBUM_GRID_VIEW")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => albumStoreActions.setViewMode(AlbumViewMode.List)}
                  aria-pressed={viewMode === AlbumViewMode.List}
                  aria-label={t("ALBUM_LIST_VIEW")}
                  className={cn(
                    "h-8 w-8 rounded-md p-0 transition-all duration-300",
                    viewMode === AlbumViewMode.List
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <List className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("ALBUM_LIST_VIEW")}</TooltipContent>
            </Tooltip>
          </div>
        </>
      }
    />
  )
}
