import { type FormEvent, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { XIcon } from "lucide-react"

import { AppMainCard } from "@/components/common/app-main-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  independentWindowMockApi,
  type RenameDraftState,
} from "@/components/independent-window/mock"
import { UtilityWindowLayout } from "@/components/independent-window/utility-window-layout"
import { resolveIndependentWindowErrorMessage } from "@/components/independent-window/utils"

export function PicGoRenamePage() {
  const { t } = useTranslation()
  const [renameDraft, setRenameDraft] = useState<RenameDraftState | null>(null)
  const [fileName, setFileName] = useState("")
  const [isInputInvalid, setIsInputInvalid] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Hydrate rename draft data once so confirm/cancel behavior can follow legacy semantics.
  useEffect(() => {
    let mounted = true

    const loadRenameDraft = async () => {
      try {
        const draft = await independentWindowMockApi.getRenameDraft()
        if (!mounted) {
          return
        }
        setRenameDraft(draft)
        setFileName(draft.fileName)
        setIsInputInvalid(false)
      } catch (error) {
        console.error(
          `[rename-page] load draft failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
        )
      }
    }

    loadRenameDraft().catch(() => {
      // Error handling is done in loadRenameDraft.
    })

    return () => {
      mounted = false
    }
  }, [t])

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = fileName.trim()

    if (!normalized) {
      setIsInputInvalid(true)
      console.warn(`[rename-page] ${t("TIPS_UPLOADER_CONFIG_NAME_EMPTY")}`)
      return
    }

    setIsInputInvalid(false)
    setSubmitting(true)
    try {
      const result = await independentWindowMockApi.confirmRename(normalized)
      setFileName(result.fileName)
      setIsInputInvalid(false)
      console.info(`[rename-page] rename confirmed: ${result.fileName}`)
    } catch (error) {
      console.error(
        `[rename-page] rename confirm failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!renameDraft) {
      return
    }

    setSubmitting(true)
    try {
      const result = await independentWindowMockApi.cancelRename()
      setFileName(result.fileName)
      setIsInputInvalid(false)
      console.info(`[rename-page] rename canceled: ${result.fileName}`)
    } catch (error) {
      console.error(
        `[rename-page] rename cancel failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <UtilityWindowLayout page="rename">
      <AppMainCard className="h-(--app-utility-shell-height) w-full flex-none rounded-xl border-(--app-panel-border) bg-(--app-panel-bg) px-4 py-4">
        <form className="flex h-full flex-col" onSubmit={handleConfirm}>
          <Label htmlFor="rename-file-name" className="text-sm font-semibold">
            {t("FILE_RENAME")}
          </Label>

          <div className="flex flex-1 items-center">
            <div className="relative w-full">
              <Input
                id="rename-file-name"
                value={fileName}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setFileName(nextValue)
                  if (nextValue.trim()) {
                    setIsInputInvalid(false)
                  }
                }}
                autoFocus
                disabled={submitting}
                aria-label={t("FILE_RENAME")}
                aria-invalid={isInputInvalid ? true : undefined}
                className="h-8 pr-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setFileName("")
                  setIsInputInvalid(false)
                }}
                disabled={submitting || fileName.length === 0}
                title="rename-clear-file-name"
                className="text-muted-foreground hover:text-foreground absolute right-1 top-1/2 -translate-y-1/2"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={submitting}
            >
              {t("CANCEL")}
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {t("CONFIRM")}
            </Button>
          </div>
        </form>
      </AppMainCard>
    </UtilityWindowLayout>
  )
}
