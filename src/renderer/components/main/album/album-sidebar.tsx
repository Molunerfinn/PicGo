import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AlbumSource } from "#/types/cloudAlbum"
import { AlbumSourceSwitcher } from "@/components/common/album-source-switcher"
import { CloudFeatureHighlights } from "@/components/common/cloud-feature-highlights"
import { CloudRefreshButton } from "@/components/common/cloud-refresh-button"
import { useCloudAlbumStatsQuery } from "@/queries/picgo-cloud-album-stats"
import { useAppStore } from "@/store"
import { CloudSidebarSkeleton } from "./cloud-loading"
import {
  NavType,
  type AlbumProviderFilter,
  type AlbumPhoto,
  type NavContext,
} from "./utils"

export const allPhotosKey = "all"

// TODO(v3-post-launch): Restore TagButtonProps when Tags sidebar filter is re-enabled.
// type TagButtonProps = {
//   label: string
//   active: boolean
//   onClick: () => void
// }

type AlbumNavButtonProps = {
  label: string
  count?: number | string
  active: boolean
  onClick: () => void
}

type AlbumSidebarProps = {
  images: AlbumPhoto[]
  providers: AlbumProviderFilter[]
  navContext: NavContext
  albumSource: AlbumSource
  isCloudAvailable: boolean
  // TODO(v3-post-launch): Restore tag suggestions input when Tags feature returns.
  // tagSuggestions: string[]
  onFilterChange: (next: NavContext) => void
  onCloudRefresh?: () => Promise<void> | void
}

// TODO(v3-post-launch): Restore TagButton when Tags sidebar filter is re-enabled.
// function TagButton({ label, active, onClick }: TagButtonProps) {
//   return (
//     <Button
//       type="button"
//       variant="ghost"
//       size="xs"
//       onClick={onClick}
//       className={cn(
//         "h-7 rounded-xl px-3 text-xs transition-all duration-300",
//         "focus-visible:ring-0 focus-visible:border-transparent",
//         "focus-visible:bg-(--app-sidebar-item-hover-bg)",
//         active
//           ? "bg-(--app-sidebar-item-active-bg) text-(--app-sidebar-item-active-color) hover:bg-(--app-sidebar-item-active-bg) hover:text-(--app-sidebar-item-active-color)"
//           : "text-muted-foreground hover:bg-(--app-sidebar-item-hover-bg) hover:text-(--app-sidebar-item-active-color)"
//       )}
//     >
//       #{label}
//     </Button>
//   )
// }

function AlbumNavButton({
  label,
  count,
  active,
  onClick,
}: AlbumNavButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "group/sidebar-item h-10 w-full rounded-md transition-all duration-300 cursor-pointer justify-between px-3",
        "focus-visible:ring-0 focus-visible:border-transparent",
        "focus-visible:bg-(--app-sidebar-item-hover-bg)",
        active
          ? "bg-(--app-sidebar-item-active-bg) text-(--app-sidebar-item-active-color) hover:bg-(--app-sidebar-item-active-bg) hover:text-(--app-sidebar-item-active-color)"
          : "text-muted-foreground hover:bg-(--app-sidebar-item-hover-bg) hover:text-(--app-sidebar-item-active-color)"
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "text-left transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
          active ? "font-semibold" : "font-medium"
        )}
      >
        {label}
      </span>
      {count !== undefined ? (
        <Badge
          variant="secondary"
          className={cn(
            "h-5 rounded-full px-2 text-[10px] font-semibold",
            active
              ? "bg-(--app-sidebar-item-active-bg) text-(--app-sidebar-item-active-color)"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </Badge>
      ) : null}
    </Button>
  )
}

export function AlbumSidebar({
  images,
  providers,
  navContext,
  albumSource,
  isCloudAvailable,
  // TODO(v3-post-launch): Restore tagSuggestions usage when Tags sidebar filter is re-enabled.
  // tagSuggestions,
  onFilterChange,
  onCloudRefresh,
}: AlbumSidebarProps) {
  const { t } = useTranslation()
  const isCloud = albumSource === AlbumSource.CLOUD
  const showCloudNav = isCloud && isCloudAvailable
  const picBeds = useAppStore.use.picBeds()
  const cloudStatsQuery = useCloudAlbumStatsQuery({ enabled: showCloudNav })

  const cloudStats = cloudStatsQuery.data
  const cloudStatsError = showCloudNav && cloudStatsQuery.isError
  const cloudProviderFilters: AlbumProviderFilter[] = (cloudStats?.types ?? []).map((stat) => {
    const bed = picBeds.find((b) => b.type === stat.type)
    return {
      type: stat.type,
      name: bed?.name ?? stat.type,
      count: stat.count,
    }
  })

  const displayProviders = showCloudNav
    ? cloudProviderFilters
    : isCloud
      ? []
      : providers
  const allPhotosCount: number | string = showCloudNav
    ? (cloudStatsError ? "—" : (cloudStats?.total ?? 0))
    : isCloud
      ? 0
      : images.length
  const isCloudLoading = showCloudNav && cloudStatsQuery.isPending && !cloudStats
  const showNavList = !isCloud || showCloudNav

  // TODO(v3-post-launch): Restore collection count aggregation when Collections sidebar section is re-enabled.
  // const collectionCounts: Record<string, number> = {}
  // collections.forEach((collection) => {
  //   collectionCounts[collection] = 0
  // })
  // images.forEach((image) => {
  //   collectionCounts[image.collection] =
  //     (collectionCounts[image.collection] ?? 0) + 1
  // })

  // TODO(v3-post-launch): Restore sidebar tag derivation when Tags sidebar section is re-enabled.
  // const sidebarTags = buildSidebarTags(images, tagSuggestions)

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-(--app-gallery-sidebar-width) shrink-0 flex-col overflow-hidden rounded-xl border backdrop-blur-xl">
      <div className="border-sidebar-border/60 flex flex-col gap-3 border-b px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <h1 className="text-base font-semibold">{t("ALBUM")}</h1>
            {showCloudNav && onCloudRefresh ? (
              <CloudRefreshButton onRefresh={onCloudRefresh} />
            ) : null}
          </div>
          <AlbumSourceSwitcher />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="relative p-2">
          {isCloudLoading ? (
            <CloudSidebarSkeleton />
          ) : showNavList ? (
            <div className="space-y-1">
              <AlbumNavButton
                label={t("ALBUM_ALL_PHOTOS")}
                count={allPhotosCount}
                active={navContext.type === NavType.All}
                onClick={() =>
                  onFilterChange({ type: NavType.All, value: allPhotosKey })
                }
              />
              {displayProviders.map((provider) => (
                <AlbumNavButton
                  key={provider.type}
                  label={provider.name}
                  count={provider.count}
                  active={
                    navContext.type === NavType.Provider &&
                  navContext.value === provider.type
                  }
                  onClick={() =>
                    onFilterChange({ type: NavType.Provider, value: provider.type })
                  }
                />
              ))}
            </div>
          ) : (
            <CloudFeatureHighlights />
          )}

          {/* TODO(v3-post-launch): Restore Collections sidebar section for v3+ feature reactivation.
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {t("ALBUM_COLLECTIONS")}
              </div>
              <Button variant="ghost" size="icon-xs">
                <Plus className="size-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {collections.map((collection) => (
                <AlbumNavButton
                  key={collection}
                  label={collection}
                  count={collectionCounts[collection] ?? 0}
                  active={
                    navContext.type === NavType.Collection &&
                    navContext.value === collection
                  }
                  onClick={() =>
                    onFilterChange({
                      type: NavType.Collection,
                      value: collection,
                    })
                  }
                />
              ))}
            </div>
          </div>
          */}

          {/* TODO(v3-post-launch): Restore Tags sidebar section for v3+ feature reactivation.
          <div className="space-y-3">
            <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              {t("ALBUM_TAGS")}
            </div>
            <div className="flex flex-wrap gap-2">
              {sidebarTags.map((tag) => (
                <TagButton
                  key={tag}
                  label={tag}
                  active={navContext.type === NavType.Tag && navContext.value === tag}
                  onClick={() =>
                    onFilterChange({ type: NavType.Tag, value: tag })
                  }
                />
              ))}
            </div>
          </div>
          */}
        </div>
      </ScrollArea>
    </aside>
  )
}
