import { LoaderCircleIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function CloudGalleryLoading () {
  return (
    <div className="flex flex-1 items-center justify-center">
      <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export function CloudSidebarSkeleton () {
  return (
    <div className="space-y-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}
