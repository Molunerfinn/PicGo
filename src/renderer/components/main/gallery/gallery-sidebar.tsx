import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AlbumSource } from "#/types/cloudAlbum"
import { AlbumSourceSwitcher } from "@/components/common/album-source-switcher"
import { CloudFeatureHighlights } from "./cloud-feature-highlights"
import { CloudSidebarSkeleton } from "./cloud-loading"
import {
  NavType,
  type GalleryProviderFilter,
  type GalleryPhoto,
  type NavContext,
} from "./utils"

export const allPhotosKey = "all"

// TODO(v3-post-launch): Restore TagButtonProps when Tags sidebar filter is re-enabled.
// type TagButtonProps = {
//   label: string
//   active: boolean
//   onClick: () => void
// }

type GalleryNavButtonProps = {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}

type GallerySidebarProps = {
  images: GalleryPhoto[]
  providers: GalleryProviderFilter[]
  navContext: NavContext
  albumSource: AlbumSource
  isCloudAvailable: boolean
  cloudLoading?: boolean
  cloudProviders?: GalleryProviderFilter[]
  cloudAllTotal?: number
  // TODO(v3-post-launch): Restore tag suggestions input when Tags feature returns.
  // tagSuggestions: string[]
  onFilterChange: (next: NavContext) => void
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

function GalleryNavButton({
  label,
  count,
  active,
  onClick,
}: GalleryNavButtonProps) {
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

export function GallerySidebar({
  images,
  providers,
  navContext,
  albumSource,
  isCloudAvailable,
  cloudLoading,
  cloudProviders,
  cloudAllTotal,
  // TODO(v3-post-launch): Restore tagSuggestions usage when Tags sidebar filter is re-enabled.
  // tagSuggestions,
  onFilterChange,
}: GallerySidebarProps) {
  const { t } = useTranslation()
  const isCloud = albumSource === AlbumSource.CLOUD
  const showCloudNav = isCloud && isCloudAvailable
  const displayProviders = showCloudNav ? (cloudProviders ?? []) : isCloud ? [] : providers
  const allPhotosCount = showCloudNav ? (cloudAllTotal ?? 0) : isCloud ? 0 : images.length
  const hasCloudData = (cloudProviders ?? []).length > 0 || (cloudAllTotal ?? 0) > 0
  const isCloudLoading = isCloud && isCloudAvailable && (cloudLoading ?? false) && !hasCloudData
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
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">{t("GALLERY")}</h1>
          <AlbumSourceSwitcher />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="relative p-2">
          {isCloudLoading ? (
            <CloudSidebarSkeleton />
          ) : showNavList ? (
            <div className="space-y-1">
              <GalleryNavButton
                label={t("GALLERY_ALL_PHOTOS")}
                count={allPhotosCount}
                active={navContext.type === NavType.All}
                onClick={() =>
                  onFilterChange({ type: NavType.All, value: allPhotosKey })
                }
              />
              {displayProviders.map((provider) => (
                <GalleryNavButton
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
                {t("GALLERY_COLLECTIONS")}
              </div>
              <Button variant="ghost" size="icon-xs">
                <Plus className="size-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {collections.map((collection) => (
                <GalleryNavButton
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
              {t("GALLERY_TAGS")}
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
