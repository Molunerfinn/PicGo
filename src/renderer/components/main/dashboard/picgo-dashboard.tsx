import { useEffect, useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import {
  ClipboardIcon,
  CodeIcon,
  FileCodeIcon,
  FolderOpenIcon,
  HistoryIcon,
  ImageIcon,
  LinkIcon,
  SettingsIcon,
  UploadIcon
} from 'lucide-react'
import { IPasteStyle } from '~/universal/types/enum'
import { extractHttpUrlsFromText, isUrl, parseNewlineSeparatedUrls } from '#/utils/common'
import { handleCloudImportAll } from '@/adapters/cloud-album'
import { dashboardAdapter } from '@/adapters/dashboard'
import { AppMainCard } from '@/components/common/app-main-card'
import { FloatingPanelSheetContent } from '@/components/common/floating-panel-sheet-content'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useIPCOn } from '@/hooks/useIPC'
import { cn } from '@/lib/utils'
import { appActions, settingsStoreActions, useAppStore , useGalleryStore } from '@/store'
import { DESKTOP_HISTORY_PANEL_BREAKPOINT } from '@/utils/consts'
import { UploaderSwitcher } from './uploader-switcher'
import { buildVisibleProviderOptions, resolveCurrentSwitcherValue } from './utils'
import { HistoryPanel } from './history-panel'
import { useDashboardHistory } from './hooks/use-dashboard-history'
import { useDashboardCloudHistory } from './hooks/use-dashboard-cloud-history'
import { useDashboardUpload } from './hooks/use-dashboard-upload'
import { AlbumSource } from '#/types/cloudAlbum'
import type { LinkFormat } from '@/types/dashboard'

function ProgressBar ({ value }: { value: number }) {
  return (
    <div className="bg-secondary h-2 w-48 overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function resolveLinkFormat (pasteStyle: string | undefined): LinkFormat {
  switch (pasteStyle) {
    case IPasteStyle.HTML:
      return 'HTML'
    case IPasteStyle.URL:
      return 'URL'
    case IPasteStyle.UBB:
      return 'UBB'
    case IPasteStyle.CUSTOM:
      return 'Custom'
    default:
      return 'Markdown'
  }
}

function resolvePersistedPasteStyle (linkFormat: LinkFormat) {
  switch (linkFormat) {
    case 'HTML':
      return IPasteStyle.HTML
    case 'URL':
      return IPasteStyle.URL
    case 'UBB':
      return IPasteStyle.UBB
    case 'Custom':
      return IPasteStyle.CUSTOM
    default:
      return IPasteStyle.MARKDOWN
  }
}

export function PicGoDashboard () {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const linkFormats: Array<{ id: LinkFormat, icon: ReactNode, label: string }> = [
    { id: 'Markdown', icon: <ImageIcon className="size-3.5" />, label: 'Markdown' },
    { id: 'HTML', icon: <CodeIcon className="size-3.5" />, label: 'HTML' },
    { id: 'URL', icon: <LinkIcon className="size-3.5" />, label: 'URL' },
    { id: 'UBB', icon: <FileCodeIcon className="size-3.5" />, label: 'UBB' },
    { id: 'Custom', icon: <SettingsIcon className="size-3.5" />, label: t('CUSTOM') }
  ]

  const [isHistoryOpen, setHistoryOpen] = useState(false)
  const [isHistorySheetThumbnailReady, setHistorySheetThumbnailReady] = useState(false)
  const [isDesktopHistoryVisible, setDesktopHistoryVisible] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= DESKTOP_HISTORY_PANEL_BREAKPOINT
  })
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const localHistoryItems = useDashboardHistory()
  const cloudHistory = useDashboardCloudHistory()
  const albumSource = useGalleryStore.use.albumSource()
  const isCloudSource = albumSource === AlbumSource.CLOUD
  const historyItems = isCloudSource ? cloudHistory.items : localHistoryItems
  const historyLoading = isCloudSource ? cloudHistory.loading : false

  const {
    fileInputRef,
    isUploading,
    uploadProgress,
    startUpload,
    handleFileChange,
    uploadClipboardFiles,
    uploadFileList,
    uploadUrls
  } = useDashboardUpload()

  const providers = useAppStore.use.providers()
  const appConfig = useAppStore.use.appConfig()

  const providerOptions = buildVisibleProviderOptions(providers, appConfig)
  const currentSelection = resolveCurrentSwitcherValue(providerOptions, appConfig)
  const hasVisibleProviders = providerOptions.length > 0
  const linkFormat = resolveLinkFormat(appConfig?.settings.pasteStyle)

  useIPCOn('syncPicBed', async () => {
    try {
      await Promise.all([appActions.refreshAppConfig(), appActions.refreshPicBeds()])
    } catch (error) {
      console.error(error)
    }
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistorySheetThumbnailReady(isHistoryOpen)
    }, 100)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isHistoryOpen])

  useEffect(() => {
    const handleResize = () => {
      setDesktopHistoryVisible(window.innerWidth >= DESKTOP_HISTORY_PANEL_BREAKPOINT)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handlePasteStyleChange = async (nextFormat: LinkFormat) => {
    try {
      await settingsStoreActions.saveSettingsConfig({
        pasteStyle: resolvePersistedPasteStyle(nextFormat)
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('OPERATION_FAILED'))
    }
  }

  const confirmLargeUrlBatch = (count: number) => {
    if (count <= 10) {
      return true
    }

    return window.confirm(t('TIPS_TOO_MANY_URLS_CONFIRM', { n: count }))
  }

  const uploadUrlsWithValidation = async (urls: string[], invalidLines: string[]) => {
    if (invalidLines.length > 0) {
      dashboardAdapter.logInvalidUrlLines(invalidLines)
      toast.warning(t('TIPS_SKIPPED_INVALID_URLS', { n: invalidLines.length }))
    }

    if (!confirmLargeUrlBatch(urls.length)) {
      return false
    }

    uploadUrls(urls)
    return true
  }

  const handlePlainTextDrop = async (plainText: string) => {
    const { urls, invalidLines } = parseNewlineSeparatedUrls(plainText, {
      source: 'plain'
    })

    if (!urls.length) {
      toast.error(t('TIPS_DRAG_VALID_PICTURE_OR_URL'))
      return
    }

    await uploadUrlsWithValidation(urls, invalidLines)
  }

  const handleUriListDrop = async (uriListText: string, urlString: string) => {
    const { urls, invalidLines } = parseNewlineSeparatedUrls(uriListText, {
      source: 'uri-list'
    })

    if (urls.length) {
      await uploadUrlsWithValidation(urls, invalidLines)
      return
    }

    const urlMatch = urlString.match(/<img.*src="(.*?)"/)
    if (urlMatch && isUrl(urlMatch[1])) {
      await uploadUrlsWithValidation([urlMatch[1]], invalidLines)
      return
    }

    toast.error(t('TIPS_DRAG_VALID_PICTURE_OR_URL'))
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const { dataTransfer } = event
    if (dataTransfer.files.length > 0) {
      uploadFileList(dataTransfer.files)
      return
    }

    const uriList = dataTransfer.getData('text/uri-list')
    if (uriList) {
      await handleUriListDrop(uriList, dataTransfer.getData('text/html'))
      return
    }

    const plainText = dataTransfer.getData('text/plain')
    if (plainText) {
      await handlePlainTextDrop(plainText)
      return
    }

    toast.error(t('TIPS_DRAG_VALID_PICTURE_OR_URL'))
  }

  const handleUrlButtonClick = async () => {
    let clipboardText = ''

    try {
      clipboardText = await navigator.clipboard.readText()
    } catch {}

    setUrlInput(extractHttpUrlsFromText(clipboardText).join('\n'))
    setUrlDialogOpen(true)
  }

  const handleUrlDialogSubmit = async () => {
    if (!urlInput.trim()) {
      return
    }

    const { urls, invalidLines } = parseNewlineSeparatedUrls(urlInput, {
      source: 'plain'
    })

    if (!urls.length) {
      if (invalidLines.length > 0) {
        dashboardAdapter.logInvalidUrlLines(invalidLines)
        toast.error(t('TIPS_SKIPPED_INVALID_URLS', { n: invalidLines.length }))
        return
      }

      toast.error(t('TIPS_NO_VALID_URLS'))
      return
    }

    const didStart = await uploadUrlsWithValidation(urls, invalidLines)
    if (didStart) {
      setUrlDialogOpen(false)
      setUrlInput('')
    }
  }

  return (
    <>
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="group/dropzone relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-primary/20 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:bg-slate-900/20"
          onDragOver={(event) => {
            event.preventDefault()
          }}
          onDrop={async (event) => {
            await handleDrop(event)
          }}
        >
          <div className="absolute right-4 top-4 z-20 xl:hidden">
            <Sheet open={isHistoryOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="rounded-full border-border bg-card/80 shadow-sm backdrop-blur hover:bg-card"
                  title={t('DASHBOARD_HISTORY_PANEL_TITLE')}
                >
                  <HistoryIcon className="size-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <FloatingPanelSheetContent
                side="right"
                className="w-[300px] border-(--app-panel-border) bg-(--app-panel-bg) text-foreground backdrop-blur-xl sm:w-[350px]"
              >
                <HistoryPanel items={historyItems} loadThumbnails={isHistorySheetThumbnailReady} loading={historyLoading} onStartImport={handleCloudImportAll} onCloudRefresh={cloudHistory.refresh} />
              </FloatingPanelSheetContent>
            </Sheet>
          </div>

          {currentSelection
            ? (
              <div
                className={cn(
                  'pointer-events-none absolute left-1/2 top-4 z-10 flex w-full -translate-x-1/2 justify-center transition-opacity duration-300',
                  isUploading ? 'opacity-0' : 'opacity-100'
                )}
              >
                <div className="pointer-events-auto">
                  <UploaderSwitcher
                    current={currentSelection}
                    providers={providerOptions}
                  />
                </div>
              </div>
            )
            : null}

          {!hasVisibleProviders
            ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
                <div className="text-lg font-semibold">{t('DASHBOARD_NO_VISIBLE_PROVIDERS')}</div>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {t('DASHBOARD_NO_VISIBLE_PROVIDERS_DESCRIPTION')}
                </p>
                <Button
                  type="button"
                  className="mt-6"
                  onClick={() => navigate({ to: '/main/settings/settings' })}
                >
                  {t('DASHBOARD_OPEN_SETTINGS')}
                </Button>
              </div>
            )
            : (
              <div className="relative mt-8 flex w-full flex-col items-center px-4">
                <div className="animate-in fade-in zoom-in flex flex-col items-center duration-500">
                  <div className="inline-flex size-24 rotate-3 items-center justify-center rounded-[2.5rem] bg-gradient-to-tr from-primary to-blue-400 shadow-2xl shadow-primary/20 transition-all duration-500 group-hover/dropzone:rotate-12 group-hover/dropzone:scale-110">
                    <UploadIcon className="size-11 text-white" />
                  </div>
                  <h1 className="mb-6 mt-8 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                    {t('DASHBOARD_DROP_IMAGES_HERE')}
                  </h1>
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('DASHBOARD_OR')}
                    </span>
                    <Button
                      onClick={startUpload}
                      variant="outline"
                      size="lg"
                      className="h-12 gap-2.5 bg-white px-8 text-base dark:bg-transparent"
                      disabled={isUploading}
                    >
                      <FolderOpenIcon className="size-5 text-primary" />
                      <span>
                        {isUploading
                          ? `${t('UPLOADING')}...`
                          : t('DASHBOARD_CLICK_TO_UPLOAD')}
                      </span>
                    </Button>

                    {isUploading
                      ? (
                        <div className="animate-in fade-in slide-in-from-top-2 w-48 duration-300">
                          <ProgressBar value={uploadProgress} />
                        </div>
                      )
                      : null}

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="mb-2 mt-4 flex items-center justify-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            {linkFormats.map((format) => (
              <button
                key={format.id}
                onClick={async () => {
                  await handlePasteStyleChange(format.id)
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-300',
                  linkFormat === format.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {format.icon}
                <span>{format.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 bg-white px-4 text-xs font-medium shadow-none dark:bg-transparent"
              title={t('DASHBOARD_PASTE_FROM_CLIPBOARD')}
              onClick={() => {
                uploadClipboardFiles()
              }}
            >
              <ClipboardIcon className="size-3.5" />
              <span>{t('DASHBOARD_CLIPBOARD')}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 bg-white px-4 text-xs font-medium shadow-none dark:bg-transparent"
              title={t('DASHBOARD_PASTE_FROM_URL')}
              onClick={async () => {
                await handleUrlButtonClick()
              }}
            >
              <LinkIcon className="size-3.5" />
              <span>URL</span>
            </Button>
          </div>
        </div>
      </main>

      {isDesktopHistoryVisible
        ? (
          <AppMainCard className="h-full w-80 flex-none gap-0 py-0">
            <HistoryPanel items={historyItems} loadThumbnails loading={historyLoading} onStartImport={handleCloudImportAll} onCloudRefresh={cloudHistory.refresh} />
          </AppMainCard>
        )
        : null}

      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t('TIPS_INPUT_URL')}</DialogTitle>
          </DialogHeader>
          <Textarea
            className="min-h-36 resize-y"
            placeholder={t('TIPS_HTTP_PREFIX')}
            value={urlInput}
            onChange={(event) => {
              setUrlInput(event.target.value)
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUrlDialogOpen(false)
              }}
            >
              {t('CANCEL')}
            </Button>
            <Button
              onClick={async () => {
                await handleUrlDialogSubmit()
              }}
            >
              {t('CONFIRM')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
