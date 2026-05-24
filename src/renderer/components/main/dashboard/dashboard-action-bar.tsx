import { useTranslation } from 'react-i18next'
import {
  ClipboardIcon,
  CodeIcon,
  FileCodeIcon,
  ImageIcon,
  LinkIcon,
  SettingsIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LINK_FORMAT, type LinkFormat } from '@/types/dashboard'

const LINK_FORMAT_ITEMS: Array<{ id: LinkFormat, icon: React.ReactNode, label: string | null }> = [
  { id: LINK_FORMAT.MARKDOWN, icon: <ImageIcon className="size-3.5" />, label: 'Markdown' },
  { id: LINK_FORMAT.HTML, icon: <CodeIcon className="size-3.5" />, label: 'HTML' },
  { id: LINK_FORMAT.URL, icon: <LinkIcon className="size-3.5" />, label: 'URL' },
  { id: LINK_FORMAT.UBB, icon: <FileCodeIcon className="size-3.5" />, label: 'UBB' },
  { id: LINK_FORMAT.CUSTOM, icon: <SettingsIcon className="size-3.5" />, label: null }
]

interface DashboardActionBarProps {
  linkFormat: LinkFormat
  onLinkFormatChange: (format: LinkFormat) => void
  onClipboardUpload: () => void
  onUrlUpload: () => void
}

export function DashboardActionBar ({
  linkFormat,
  onLinkFormatChange,
  onClipboardUpload,
  onUrlUpload
}: DashboardActionBarProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-2 mt-4 flex items-end justify-center gap-3">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-muted-foreground text-[11px] font-medium tracking-wide">
          {t('LINK_FORMAT')}
        </span>
        <div className="flex items-center rounded-lg border border-border bg-card p-1">
          {LINK_FORMAT_ITEMS.map((format) => (
            <button
              key={format.id}
              onClick={() => onLinkFormatChange(format.id)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-300',
                linkFormat === format.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {format.icon}
              <span>{format.label ?? t('CUSTOM')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span className="text-muted-foreground text-[11px] font-medium tracking-wide">
          {t('QUICK_UPLOAD')}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 bg-white px-4 text-xs font-medium shadow-none dark:bg-transparent"
            title={t('DASHBOARD_PASTE_FROM_CLIPBOARD')}
            onClick={onClipboardUpload}
          >
            <ClipboardIcon className="size-3.5" />
            <span>{t('DASHBOARD_CLIPBOARD')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 bg-white px-4 text-xs font-medium shadow-none dark:bg-transparent"
            title={t('DASHBOARD_PASTE_FROM_URL')}
            onClick={onUrlUpload}
          >
            <LinkIcon className="size-3.5" />
            <span>URL</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
