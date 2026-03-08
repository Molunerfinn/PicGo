import { type CSSProperties, type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "@tanstack/react-router"
import { LoaderCircleIcon } from "lucide-react"

import { AppMainCard } from "@/components/common/app-main-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  independentWindowMockApi,
  type TrayPageState,
  type TrayUploadedItem,
} from "@/components/independent-window/mock"
import {
  copyToClipboard,
  resolveIndependentWindowErrorMessage,
} from "@/components/independent-window/utils"
import { UtilityWindowLayout } from "@/components/independent-window/utility-window-layout"

function TraySectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-muted-foreground border-border/70 border-b px-1 py-1 text-center text-xs font-medium">
      {title}
    </h2>
  )
}

function TrayImageButton({
  label,
  fileName,
  imgUrl,
  title,
  onClick,
  disabled,
  trailing,
}: {
  label: string
  fileName: string
  imgUrl: string
  title: string
  onClick: () => void
  disabled?: boolean
  trailing?: ReactNode
}) {
  const fileNameStyle: CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
  }

  return (
    <button
      type="button"
      className={cn(
        "hover:bg-primary/10 focus-visible:ring-ring flex w-full cursor-pointer flex-col gap-2 rounded-lg p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none",
        disabled ? "cursor-not-allowed opacity-60 hover:bg-transparent" : ""
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} ${fileName}`}
      title={title}
    >
      <div className="relative w-full overflow-hidden rounded-md border border-border/70 bg-card">
        <img
          src={imgUrl}
          alt={fileName}
          className="block h-auto w-full"
          loading="lazy"
        />
        {trailing ? (
          <div className="bg-background/80 text-muted-foreground absolute right-1 top-1 rounded-full p-1">
            {trailing}
          </div>
        ) : null}
      </div>
      <p
        className="w-full px-1 text-center text-xs font-medium leading-4"
        style={fileNameStyle}
      >
        {fileName}
      </p>
    </button>
  )
}

export function PicGoTrayPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [state, setState] = useState<TrayPageState>({
    waiting: [],
    uploaded: [],
  })
  const [loading, setLoading] = useState(true)
  const [uploadingWaitingId, setUploadingWaitingId] = useState<string | null>(
    null
  )

  // Load mock tray data so page structure mirrors the legacy first-screen state.
  useEffect(() => {
    let mounted = true

    const loadTrayState = async () => {
      try {
        const nextState = await independentWindowMockApi.getTrayPageState()
        if (!mounted) {
          return
        }
        setState(nextState)
      } catch (error) {
        console.error(
          `[tray-page] load state failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadTrayState().catch(() => {
      // Error handling is done in loadTrayState.
    })

    return () => {
      mounted = false
    }
  }, [t])

  const handleOpenMainWindow = async () => {
    try {
      await independentWindowMockApi.openMainWindow()
      console.info("[tray-page] open main window")
      navigate({ to: "/main/dashboard" })
    } catch (error) {
      console.error(
        `[tray-page] open main window failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    }
  }

  const handleUploadWaitingItem = async (itemId: string) => {
    if (uploadingWaitingId) {
      return
    }

    setUploadingWaitingId(itemId)
    try {
      const uploadedItem = await independentWindowMockApi.uploadTrayWaitingItem(
        itemId
      )
      setState((current) => ({
        waiting: current.waiting.filter((item) => item.id !== itemId),
        uploaded: [uploadedItem, ...current.uploaded].slice(0, 5),
      }))
      console.info(`[tray-page] upload succeeded: ${uploadedItem.fileName}`)
    } catch (error) {
      console.error(
        `[tray-page] upload failed: ${resolveIndependentWindowErrorMessage(error, t("UPLOAD_FAILED"))}`
      )
    } finally {
      setUploadingWaitingId(null)
    }
  }

  const handleCopyUploadedLink = async (item: TrayUploadedItem) => {
    try {
      const link = await independentWindowMockApi.copyTrayUploadedLink(item.id)
      await copyToClipboard(link)
      console.info(`[tray-page] copied link: ${link}`)
    } catch (error) {
      console.error(
        `[tray-page] copy link failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    }
  }

  return (
    <UtilityWindowLayout page="tray">
      <AppMainCard className="h-(--app-utility-shell-height) w-full gap-0 overflow-hidden rounded-xl border-(--app-panel-border) bg-(--app-panel-bg) py-0">
        <button
          type="button"
          className="h-8 w-full cursor-pointer bg-primary/80 px-3 text-center text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary dark:bg-primary/75 dark:hover:bg-primary"
          onClick={handleOpenMainWindow}
        >
          {t("OPEN_MAIN_WINDOW")}
        </button>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 p-2">
            {state.waiting.length > 0 ? (
              <section className="space-y-1">
                <TraySectionTitle title={t("WAIT_TO_UPLOAD")} />
                {state.waiting.map((item) => (
                  <TrayImageButton
                    key={item.id}
                    label={t("WAIT_TO_UPLOAD")}
                    fileName={item.fileName}
                    imgUrl={item.imgUrl}
                    title="tray-waiting-item"
                    onClick={() => handleUploadWaitingItem(item.id)}
                    disabled={Boolean(uploadingWaitingId)}
                    trailing={
                      uploadingWaitingId === item.id ? (
                        <LoaderCircleIcon className="text-primary size-3.5 animate-spin" />
                      ) : null
                    }
                  />
                ))}
              </section>
            ) : null}

            <section className="space-y-1">
              <TraySectionTitle title={t("ALREADY_UPLOAD")} />
              {loading ? (
                <p className="text-muted-foreground px-1 py-2 text-center text-xs">
                  {t("UPLOADING")}...
                </p>
              ) : state.uploaded.length === 0 ? (
                <p className="text-muted-foreground px-1 py-2 text-center text-xs">
                  {t("TRAY_ALREADY_UPLOAD_EMPTY")}
                </p>
              ) : (
                state.uploaded.map((item) => (
                  <TrayImageButton
                    key={item.id}
                    label={t("ALREADY_UPLOAD")}
                    fileName={item.fileName}
                    imgUrl={item.imgUrl}
                    title="tray-uploaded-item"
                    onClick={() => handleCopyUploadedLink(item)}
                  />
                ))
              )}
            </section>
          </div>
        </ScrollArea>
      </AppMainCard>
    </UtilityWindowLayout>
  )
}
