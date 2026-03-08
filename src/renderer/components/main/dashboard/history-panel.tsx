import { MoreHorizontalIcon, SearchIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { galleryAdapter } from '@/adapters/gallery'
import { RECENT_UPLOAD_TYPE, type RecentUpload } from '@/types/dashboard'
import { HistoryItem } from './history-item'

interface DashboardHistoryItem extends RecentUpload {
  group: 'today' | 'yesterday'
  raw: ImgInfo
  keywords: string[]
}

function formatRelativeTime (item: ImgInfo, index: number) {
  const timestamp =
    typeof item._updatedAt === 'number'
      ? item._updatedAt
      : typeof item._createdAt === 'number'
        ? item._createdAt
        : null

  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: 'auto'
  })

  if (timestamp === null) {
    return formatter.format(-(index + 1), 'hour')
  }

  const diffMs = timestamp - Date.now()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return formatter.format(diffDays, 'day')
}

function buildHistoryItems (items: ImgInfo[]): DashboardHistoryItem[] {
  return items.map((item, index) => {
    const name = item.fileName || item.imgUrl || item.originImgUrl || item.id || `${index + 1}`
    const keywords = [name, item.imgUrl, item.originImgUrl, item.fileName]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)

    return {
      id: item.id || item.imgUrl || `${index}`,
      name,
      time: formatRelativeTime(item, index),
      type: item.type === 'file' ? RECENT_UPLOAD_TYPE.FILE : RECENT_UPLOAD_TYPE.IMAGE,
      group: index < 8 ? 'today' : 'yesterday',
      raw: item,
      keywords
    }
  })
}

export function HistoryPanel ({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const [historyItems, setHistoryItems] = useState<DashboardHistoryItem[]>([])

  useEffect(() => {
    let disposed = false

    async function refreshHistory () {
      try {
        const items = await galleryAdapter.getRecentUploads(10)
        if (!disposed) {
          setHistoryItems(buildHistoryItems(items))
        }
      } catch (error) {
        if (!disposed) {
          console.error(error)
        }
      }
    }

    refreshHistory().catch(() => undefined)

    const unsubscribe = galleryAdapter.subscribeToUpdates(() => {
      refreshHistory().catch(() => undefined)
    })

    return () => {
      disposed = true
      unsubscribe()
    }
  }, [])

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) {
      return historyItems
    }

    return historyItems.filter((item) => {
      return item.keywords.some((value) => value.toLowerCase().includes(keyword))
    })
  }, [historyItems, searchText])

  const todayItems = filteredItems.filter((item) => item.group === 'today')
  const yesterdayItems = filteredItems.filter((item) => item.group === 'yesterday')

  const handleCopy = async (item: DashboardHistoryItem) => {
    try {
      await galleryAdapter.copyImageLink(item.raw)
      toast.success(t('COPY_LINK_SUCCEED'))
    } catch (error) {
      console.error(error)
      toast.error(t('OPERATION_FAILED'))
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="px-4 pb-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('HISTORY_PANEL_TITLE')}</h2>
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
            placeholder={t('HISTORY_PANEL_FILTER_PLACEHOLDER')}
            className="bg-muted/50 border-transparent placeholder:text-muted-foreground/70 focus:bg-background focus:border-primary/50 h-9 pl-9 text-xs transition-all"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value)
            }}
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
              {t('HISTORY_PANEL_TODAY')}
            </p>
            {todayItems.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onCopy={() => {
                  handleCopy(item).catch(() => undefined)
                }}
              />
            ))}
          </div>
          {yesterdayItems.length > 0
            ? (
              <div className="space-y-3">
                <p className="text-muted-foreground px-2 text-[10px] font-bold uppercase tracking-wider">
                  {t('HISTORY_PANEL_YESTERDAY')}
                </p>
                {yesterdayItems.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onCopy={() => {
                      handleCopy(item).catch(() => undefined)
                    }}
                  />
                ))}
              </div>
            )
            : null}
        </div>
      </ScrollArea>
    </div>
  )
}
