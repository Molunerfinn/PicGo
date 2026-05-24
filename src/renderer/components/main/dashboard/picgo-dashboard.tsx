import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import {
  FolderOpenIcon,
  HistoryIcon,
  UploadIcon
} from 'lucide-react'
import { handleCloudImportAll } from '@/adapters/cloud-album'
import { AppMainCard } from '@/components/common/app-main-card'
import { FloatingPanelSheetContent } from '@/components/common/floating-panel-sheet-content'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { useIPCOn } from '@/hooks/useIPC'
import { cn } from '@/lib/utils'
import { appActions, settingsStoreActions, useAppStore, useAlbumStore } from '@/store'
import { DESKTOP_HISTORY_PANEL_BREAKPOINT } from '@/utils/consts'
import { AlbumSource } from '#/types/cloudAlbum'
import { UploaderSwitcher } from './uploader-switcher'
import { buildUrlDialogInitialValue, buildVisibleProviderOptions, resolveCurrentSwitcherValue, resolveLinkFormat, resolvePasteStyle } from './utils'
import { HistoryPanel } from './history-panel'
import { DashboardActionBar } from './dashboard-action-bar'
import { UrlInputDialog } from './url-input-dialog'
import { useDashboardHistory } from './hooks/use-dashboard-history'
import { useDashboardCloudHistory } from './hooks/use-dashboard-cloud-history'
import { useDashboardUpload } from './hooks/use-dashboard-upload'
import { useDashboardDropHandler } from './hooks/use-dashboard-drop-handler'
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

function useDesktopHistoryVisible () {
  const [visible, setVisible] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= DESKTOP_HISTORY_PANEL_BREAKPOINT
  })
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_HISTORY_PANEL_BREAKPOINT}px)`)
    const sync = () => setVisible(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])
  return visible
}

export function PicGoDashboard () {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [isHistoryOpen, setHistoryOpen] = useState(false)
  const [isHistorySheetThumbnailReady, setHistorySheetThumbnailReady] = useState(false)
  const isDesktopHistoryVisible = useDesktopHistoryVisible()
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [urlDialogInitial, setUrlDialogInitial] = useState('')

  const localHistoryItems = useDashboardHistory()
  const cloudHistory = useDashboardCloudHistory()
  const albumSource = useAlbumStore.use.albumSource()
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

  const { handleDrop, dispatchUrls } = useDashboardDropHandler({ uploadFileList, uploadUrls })

  const providers = useAppStore.use.providers()
  const appConfig = useAppStore.use.appConfig()
  const providerOptions = buildVisibleProviderOptions(providers, appConfig)
  const currentSelection = resolveCurrentSwitcherValue(providerOptions, appConfig)
  const hasVisibleProviders = providerOptions.length > 0
  const linkFormat = resolveLinkFormat(appConfig?.settings.pasteStyle)

  const handleSyncPicBed = useMemoizedFn(async () => {
    try {
      await Promise.all([appActions.refreshAppConfig(), appActions.refreshPicBeds()])
    } catch (error) {
      console.error(error)
    }
  })
  useIPCOn('syncPicBed', handleSyncPicBed)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistorySheetThumbnailReady(isHistoryOpen)
    }, 100)
    return () => window.clearTimeout(timer)
  }, [isHistoryOpen])

  const handleLinkFormatChange = useMemoizedFn(async (nextFormat: LinkFormat) => {
    try {
      await settingsStoreActions.saveSettingsConfig({ pasteStyle: resolvePasteStyle(nextFormat) })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('OPERATION_FAILED'))
    }
  })

  const handleUrlButtonClick = useMemoizedFn(async () => {
    setUrlDialogInitial(await buildUrlDialogInitialValue())
    setUrlDialogOpen(true)
  })

  return (
    <>
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="group/dropzone relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-primary/20 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:bg-slate-900/20"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { handleDrop(event).catch(console.error) }}
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
                  <UploaderSwitcher current={currentSelection} providers={providerOptions} />
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
                <Button type="button" className="mt-6" onClick={() => navigate({ to: '/main/settings/settings' })}>
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
                    <span className="text-sm font-medium text-muted-foreground">{t('DASHBOARD_OR')}</span>
                    <Button
                      onClick={startUpload}
                      variant="outline"
                      size="lg"
                      className="h-12 gap-2.5 bg-white px-8 text-base dark:bg-transparent"
                      disabled={isUploading}
                    >
                      <FolderOpenIcon className="size-5 text-primary" />
                      <span>{isUploading ? `${t('UPLOADING')}...` : t('DASHBOARD_CLICK_TO_UPLOAD')}</span>
                    </Button>
                    {isUploading
                      ? (
                        <div className="animate-in fade-in slide-in-from-top-2 w-48 duration-300">
                          <ProgressBar value={uploadProgress} />
                        </div>
                      )
                      : null}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              </div>
            )}
        </div>

        <DashboardActionBar
          linkFormat={linkFormat}
          onLinkFormatChange={handleLinkFormatChange}
          onClipboardUpload={uploadClipboardFiles}
          onUrlUpload={handleUrlButtonClick}
        />
      </main>

      {isDesktopHistoryVisible
        ? (
          <AppMainCard className="h-full w-80 flex-none gap-0 py-0">
            <HistoryPanel items={historyItems} loadThumbnails loading={historyLoading} onStartImport={handleCloudImportAll} onCloudRefresh={cloudHistory.refresh} />
          </AppMainCard>
        )
        : null}

      <UrlInputDialog
        open={urlDialogOpen}
        onOpenChange={setUrlDialogOpen}
        initialValue={urlDialogInitial}
        onSubmit={dispatchUrls}
      />
    </>
  )
}
