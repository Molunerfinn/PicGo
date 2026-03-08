import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"
import {
  ClipboardIcon,
  CodeIcon,
  FileCodeIcon,
  FolderOpenIcon,
  HistoryIcon,
  ImageIcon,
  LinkIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react"

import { AppMainCard } from "@/components/common/app-main-card"
import { FloatingPanelSheetContent } from "@/components/common/floating-panel-sheet-content"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store"
import { UploaderSwitcher, type UploaderSwitcherValue } from "./uploader-switcher"
import { buildVisibleProviderOptions, resolveCurrentSwitcherValue } from "./utils"
import { HistoryPanel } from "./history-panel"
import { useDashboardUpload } from "./hooks/use-dashboard-upload"
import type { LinkFormat } from "@/types/dashboard"

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="bg-secondary h-2 w-48 overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export function PicGoDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const linkFormats: Array<{ id: LinkFormat; icon: ReactNode; label: string }> = [
    { id: "Markdown", icon: <ImageIcon className="size-3.5" />, label: "Markdown" },
    { id: "HTML", icon: <CodeIcon className="size-3.5" />, label: "HTML" },
    { id: "URL", icon: <LinkIcon className="size-3.5" />, label: "URL" },
    { id: "UBB", icon: <FileCodeIcon className="size-3.5" />, label: "UBB" },
    {
      id: "Custom",
      icon: <SettingsIcon className="size-3.5" />,
      label: t("CUSTOM"),
    },
  ]

  const [isHistoryOpen, setHistoryOpen] = useState(false)
  const [linkFormat, setLinkFormat] = useState<LinkFormat>("Markdown")

  const {
    fileInputRef,
    isUploading,
    uploadProgress,
    startUpload,
    handleFileChange,
  } = useDashboardUpload()

  const ensureHydrated = useAppStore((state) => state.ensureHydrated)
  const providers = useAppStore((state) => state.providers)
  const appConfig = useAppStore((state) => state.appConfig)
  const selectDashboardProviderConfig = useAppStore(
    (state) => state.selectDashboardProviderConfig
  )

  const providerOptions = buildVisibleProviderOptions(providers, appConfig)
  const currentSelection = resolveCurrentSwitcherValue(providerOptions, appConfig)
  const hasVisibleProviders = providerOptions.length > 0

  // Hydrate global provider data so dashboard and providers stay synchronized.
  useEffect(() => {
    ensureHydrated().catch(() => {
      // Keep dashboard interactive even if provider hydration fails.
    })
  }, [ensureHydrated])

  const handleSelectProviderConfig = async (next: UploaderSwitcherValue) => {
    try {
      await selectDashboardProviderConfig(next.providerId, next.configId)
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("OPERATION_FAILED")

      toast.error(message)
      throw error
    }
  }

  return (
    <>
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="group/dropzone relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-primary/20 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:bg-slate-900/20">
          <div className="absolute right-4 top-4 z-20 xl:hidden">
            <Sheet open={isHistoryOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="rounded-full border-border bg-card/80 shadow-sm backdrop-blur hover:bg-card"
                  title={t("DASHBOARD_HISTORY_PANEL_TITLE")}
                >
                  <HistoryIcon className="size-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <FloatingPanelSheetContent
                side="right"
                className="w-[300px] border-(--app-panel-border) bg-(--app-panel-bg) text-foreground backdrop-blur-xl sm:w-[350px]"
              >
                <HistoryPanel />
              </FloatingPanelSheetContent>
            </Sheet>
          </div>

          {currentSelection ? (
            <div
              className={cn(
                "pointer-events-none absolute left-1/2 top-4 z-10 flex w-full -translate-x-1/2 justify-center transition-opacity duration-300",
                isUploading ? "opacity-0" : "opacity-100"
              )}
            >
              <div className="pointer-events-auto">
                <UploaderSwitcher
                  current={currentSelection}
                  providers={providerOptions}
                  onSelect={handleSelectProviderConfig}
                />
              </div>
            </div>
          ) : null}

          {!hasVisibleProviders ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
              <div className="text-lg font-semibold">{t("DASHBOARD_NO_VISIBLE_PROVIDERS")}</div>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {t("DASHBOARD_NO_VISIBLE_PROVIDERS_DESCRIPTION")}
              </p>
              <Button
                type="button"
                className="mt-6"
                onClick={() => navigate({ to: "/main/settings/settings" })}
              >
                {t("DASHBOARD_OPEN_SETTINGS")}
              </Button>
            </div>
          ) : (
            <div className="relative mt-8 flex w-full flex-col items-center px-4">
              <div className="animate-in fade-in zoom-in flex flex-col items-center duration-500">
                <div className="inline-flex size-24 rotate-3 items-center justify-center rounded-[2.5rem] bg-gradient-to-tr from-primary to-blue-400 shadow-2xl shadow-primary/20 transition-all duration-500 group-hover/dropzone:rotate-12 group-hover/dropzone:scale-110">
                  <UploadIcon className="size-11 text-white" />
                </div>
                <h1 className="mb-6 mt-8 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                  {t("DASHBOARD_DROP_IMAGES_HERE")}
                </h1>
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("DASHBOARD_OR")}
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
                        ? `${t("UPLOADING")}...`
                        : t("DASHBOARD_CLICK_TO_UPLOAD")}
                    </span>
                  </Button>

                  {isUploading ? (
                    <div className="animate-in fade-in slide-in-from-top-2 w-48 duration-300">
                      <ProgressBar value={uploadProgress} />
                    </div>
                  ) : null}

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
                onClick={() => setLinkFormat(format.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                  linkFormat === format.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              title={t("DASHBOARD_PASTE_FROM_CLIPBOARD")}
            >
              <ClipboardIcon className="size-3.5" />
              <span>{t("DASHBOARD_CLIPBOARD")}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 bg-white px-4 text-xs font-medium shadow-none dark:bg-transparent"
              title={t("DASHBOARD_PASTE_FROM_URL")}
            >
              <LinkIcon className="size-3.5" />
              <span>URL</span>
            </Button>
          </div>
        </div>
      </main>

      <AppMainCard className="hidden h-full w-80 flex-none gap-0 py-0 xl:flex">
        <HistoryPanel />
      </AppMainCard>
    </>
  )
}
