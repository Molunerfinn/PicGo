import dayjs from 'dayjs'
import { useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { galleryAdapter } from '@/adapters/gallery'
import { GalleryPreview } from '@/components/main/gallery/gallery-preview'
import { type GalleryPhoto, resolveIsVideo } from '@/components/main/gallery/utils'
import { SearchInput } from '@/components/common/search-input'
import { cn } from '@/lib/utils'
import { resolveTimestampValue } from '@/utils/common'
import { DEFAULT_DATE_TIME_FORMAT } from '@/utils/consts'
import type { DashboardHistoryRecord } from './hooks/use-dashboard-history'
import { HistoryItem } from './history-item'

interface DashboardHistoryItem {
  id: number | string
  previewId: number
  name: string
  time: string
  imgUrl: string
  isVideo: boolean
  timestamp: number
  raw: DashboardHistoryRecord
  keywords: string[]
}

interface DashboardHistoryGroup {
  key: string
  label: string
  items: DashboardHistoryItem[]
}

type DashboardHistoryEntry =
  | {
    type: 'header'
    key: string
    label: string
    isFirstGroup: boolean
  }
  | {
    type: 'item'
    key: string
    item: DashboardHistoryItem
  }

function resolveGalleryTimestamp (item: DashboardHistoryRecord) {
  return resolveTimestampValue(item.createdAt) || resolveTimestampValue(item.updatedAt)
}

function isSameDay (left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
}

function formatHistoryTimestamp (timestamp: number) {
  if (timestamp <= 0) {
    return ''
  }

  return dayjs(timestamp).format(DEFAULT_DATE_TIME_FORMAT)
}

function buildHistoryItems (items: DashboardHistoryRecord[]): DashboardHistoryItem[] {
  return [...items]
    .sort((left, right) => resolveGalleryTimestamp(right) - resolveGalleryTimestamp(left))
    .map((item, index) => {
      const name = item.fileName || item.imgUrl || item.originImgUrl || item.id || `${index + 1}`
      const timestamp = resolveGalleryTimestamp(item)
      const keywords = [name, item.imgUrl, item.originImgUrl, item.fileName]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)

      return {
        id: item.id || item.imgUrl || `${index}`,
        previewId: index,
        name,
        time: formatHistoryTimestamp(timestamp),
        imgUrl: item.imgUrl || item.originImgUrl || '',
        isVideo: resolveIsVideo(item),
        timestamp,
        raw: item,
        keywords
      }
    })
}

function buildGroupKey (timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatGroupLabel (timestamp: number, t: (key: string) => string) {
  const date = new Date(timestamp)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (isSameDay(date, now)) {
    return t('HISTORY_PANEL_TODAY')
  }

  if (isSameDay(date, yesterday)) {
    return t('HISTORY_PANEL_YESTERDAY')
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function buildHistoryGroups (
  items: DashboardHistoryItem[],
  t: (key: string) => string
): DashboardHistoryGroup[] {
  const groups: DashboardHistoryGroup[] = []

  items.forEach((item) => {
    const key = buildGroupKey(item.timestamp)
    const lastGroup = groups[groups.length - 1]

    if (lastGroup?.key === key) {
      lastGroup.items.push(item)
      return
    }

    groups.push({
      key,
      label: formatGroupLabel(item.timestamp, t),
      items: [item]
    })
  })

  return groups
}

function buildVirtuosoResetKey (groups: DashboardHistoryGroup[], searchText: string) {
  const groupSignature = groups
    .map((group) => `${group.key}:${group.items.map((item) => item.id).join(',')}`)
    .join('|')

  return `${searchText}:${groupSignature}`
}

function buildHistoryEntries (groups: DashboardHistoryGroup[]): DashboardHistoryEntry[] {
  return groups.flatMap((group, groupIndex) => {
    const header: DashboardHistoryEntry = {
      type: 'header',
      key: `header:${group.key}`,
      label: group.label,
      isFirstGroup: groupIndex === 0
    }

    const items = group.items.map((item): DashboardHistoryEntry => ({
      type: 'item',
      key: `item:${item.id}`,
      item
    }))

    return [header, ...items]
  })
}

export function HistoryPanel ({
  className,
  loadThumbnails = true,
  items
}: {
  className?: string
  loadThumbnails?: boolean
  items: DashboardHistoryRecord[]
}) {
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activePreviewId, setActivePreviewId] = useState<number | null>(null)
  const historyItems = buildHistoryItems(items)

  const keyword = searchText.trim().toLowerCase()
  const filteredItems = keyword
    ? historyItems.filter((item) => item.keywords.some((value) => value.toLowerCase().includes(keyword)))
    : historyItems

  const todayLabel = t('HISTORY_PANEL_TODAY')
  const yesterdayLabel = t('HISTORY_PANEL_YESTERDAY')
  const previewLabel = t('GALLERY_PREVIEW')
  const groups = buildHistoryGroups(filteredItems, (key) => {
    if (key === 'HISTORY_PANEL_TODAY') {
      return todayLabel
    }

    return yesterdayLabel
  })
  const entries = buildHistoryEntries(groups)
  const virtuosoKey = buildVirtuosoResetKey(groups, keyword)
  const previewItems: GalleryPhoto[] = filteredItems
    .filter((item) => Boolean(item.imgUrl))
    .map((item) => ({
      id: item.previewId,
      dbId: String(item.id),
      imgUrl: item.imgUrl,
      originImgUrl: item.raw.originImgUrl,
      alt: item.name,
      name: item.name,
      sizeMb: 0,
      date: item.time,
      type: item.raw.type || '',
      raw: item.raw,
      collection: '',
      tags: [],
      isVideo: item.isVideo
    }))

  const handleCopy = async (item: DashboardHistoryItem) => {
    try {
      await galleryAdapter.copyImageLink(item.raw)
      toast.success(t('COPY_LINK_SUCCEED'))
    } catch (error) {
      console.error(error)
      toast.error(t('OPERATION_FAILED'))
    }
  }

  const handlePreview = (item: DashboardHistoryItem) => {
    if (!item.imgUrl) {
      return
    }

    setActivePreviewId(item.previewId)
    setPreviewOpen(true)
  }

  return (
    <>
      <div className={cn('flex h-full min-h-0 flex-col', className)}>
        <div className="px-4 pb-4 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('HISTORY_PANEL_TITLE')}</h2>
          </div>
          <SearchInput
            value={searchText}
            onValueChange={setSearchText}
            placeholder={t('HISTORY_PANEL_FILTER_PLACEHOLDER')}
            ariaLabel={t('HISTORY_PANEL_FILTER_PLACEHOLDER')}
            clearLabel={t('GALLERY_CLEAR_SELECTION')}
          />
        </div>

        <div className="min-h-0 flex-1">
          {entries.length > 0
            ? (
              <Virtuoso
                key={virtuosoKey}
                style={{ height: '100%' }}
                data={entries}
                overscan={320}
                increaseViewportBy={320}
                computeItemKey={(index, entry) => entry?.key ?? `history-entry-${index}`}
                itemContent={(_, entry) => {
                  if (!entry) {
                    return null
                  }

                  if (entry.type === 'header') {
                    return (
                      <div
                        className={cn(
                          'px-4 pb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground',
                          entry.isFirstGroup ? 'pt-0' : 'pt-6'
                        )}
                      >
                        {entry.label}
                      </div>
                    )
                  }

                  return (
                    <div className="px-4 pb-3">
                      <HistoryItem
                        item={entry.item}
                        loadThumbnail={loadThumbnails}
                        previewLabel={previewLabel}
                        onPreview={() => {
                          handlePreview(entry.item)
                        }}
                        onCopy={async () => {
                          await handleCopy(entry.item)
                        }}
                      />
                    </div>
                  )
                }}
              />
            )
            : <div className="px-4 pb-6 text-sm text-muted-foreground" />}
        </div>
      </div>

      <GalleryPreview
        isOpen={previewOpen}
        images={previewItems}
        activeId={activePreviewId}
        onClose={() => {
          setPreviewOpen(false)
          setActivePreviewId(null)
        }}
        onActiveIdChange={(id) => {
          setActivePreviewId(id)
        }}
      />
    </>
  )
}
