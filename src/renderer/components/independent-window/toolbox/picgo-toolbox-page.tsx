import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FolderSearch2Icon,
  LoaderCircleIcon,
  RefreshCcwIcon,
  WrenchIcon,
} from "lucide-react"

import { AppMainCard } from "@/components/common/app-main-card"
import {
  independentWindowMockApi,
  type ToolboxCheckResult,
  toolboxItemCheckStatus,
  type ToolboxItemState,
  type ToolboxItemType,
} from "@/components/independent-window/mock"
import { UtilityWindowLayout } from "@/components/independent-window/utility-window-layout"
import { resolveIndependentWindowErrorMessage } from "@/components/independent-window/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

function ToolboxStatusIcon({
  status,
}: {
  status: ToolboxItemState["status"]
}) {
  if (status === toolboxItemCheckStatus.Loading) {
    return <LoaderCircleIcon className="size-4 animate-spin text-primary" />
  }

  if (status === toolboxItemCheckStatus.Success) {
    return <CheckCircle2Icon className="size-4 text-green-500" />
  }

  if (status === toolboxItemCheckStatus.Error) {
    return <AlertCircleIcon className="size-4 text-destructive" />
  }

  return <FolderSearch2Icon className="size-4 text-muted-foreground" />
}

function applyToolboxResult(
  currentItems: ToolboxItemState[],
  result: ToolboxCheckResult
) {
  return currentItems.map((item) => {
    if (item.type !== result.type) {
      return item
    }

    return {
      ...item,
      status: result.status,
      messageKey: result.messageKey,
      messageVariables: result.messageVariables,
      value: result.value,
    }
  })
}

export function PicGoToolboxPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ToolboxItemState[]>([])
  const [activeType, setActiveType] = useState<ToolboxItemType | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  // Load toolbox diagnostics definitions once so the page mirrors legacy item grouping.
  useEffect(() => {
    let mounted = true

    const loadToolboxInitialState = async () => {
      try {
        const initialState = await independentWindowMockApi.getToolboxInitialState()
        if (!mounted) {
          return
        }
        setItems(initialState)
      } catch (error) {
        console.error(
          `[toolbox-page] load initial state failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
        )
      }
    }

    loadToolboxInitialState().catch(() => {
      // Error handling is done in loadToolboxInitialState.
    })

    return () => {
      mounted = false
    }
  }, [t])

  const progress =
    items.length === 0
      ? 0
      : Math.round(
        (items.filter(
          (item) =>
            item.status !== toolboxItemCheckStatus.Init &&
            item.status !== toolboxItemCheckStatus.Loading
        ).length /
        items.length) *
        100
      )

  const isAllSuccess =
    items.length > 0 &&
    items.every((item) => item.status === toolboxItemCheckStatus.Success)

  const canFixItems = items.filter(
    (item) =>
      item.status === toolboxItemCheckStatus.Error && item.hasNoFixMethod !== true
  )
  const canFixLength = canFixItems.length

  const applyResult = (result: ToolboxCheckResult) => {
    setItems((currentItems) => applyToolboxResult(currentItems, result))
  }

  const handleCheck = async () => {
    if (items.length === 0 || isChecking || isFixing) {
      return
    }

    setActiveType(null)
    setIsChecking(true)
    const orderedTypes = items.map((item) => item.type)

    setItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        status: toolboxItemCheckStatus.Loading,
        messageKey: "",
        messageVariables: undefined,
        value: "",
      }))
    )

    try {
      for (const type of orderedTypes) {
        const result = await independentWindowMockApi.runToolboxCheck(type)
        applyResult(result)

        if (result.status === toolboxItemCheckStatus.Error) {
          setActiveType(type)
        }
      }
      console.info("[toolbox-page] toolbox scan completed")
    } catch (error) {
      console.error(
        `[toolbox-page] toolbox scan failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    } finally {
      setIsChecking(false)
    }
  }

  const handleFix = async () => {
    if (canFixLength === 0 || isFixing || isChecking) {
      return
    }

    setIsFixing(true)
    const fixTypes = canFixItems.map((item) => item.type)

    try {
      for (const type of fixTypes) {
        const result = await independentWindowMockApi.runToolboxFix(type)
        applyResult(result)
      }

      console.info("[toolbox-page] toolbox fix completed")
      const shouldRestartNow = window.confirm(t("TOOLBOX_FIX_DONE_NEED_RELOAD"))
      if (shouldRestartNow) {
        await independentWindowMockApi.restartToolboxAfterFix()
        console.info("[toolbox-page] restart confirmed")
      } else {
        console.info("[toolbox-page] restart skipped")
      }
    } catch (error) {
      console.error(
        `[toolbox-page] toolbox fix failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    } finally {
      setIsFixing(false)
    }
  }

  const handleOpenPath = async (path: string) => {
    try {
      const openedPath = await independentWindowMockApi.openToolboxPath(path)
      console.info(`[toolbox-page] opened path: ${openedPath}`)
    } catch (error) {
      console.error(
        `[toolbox-page] open path failed: ${resolveIndependentWindowErrorMessage(error, t("FAILED"))}`
      )
    }
  }

  const renderPrimaryAction = () => {
    if (progress !== 100) {
      return (
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={isChecking || isFixing || items.length === 0}
          onClick={handleCheck}
          title="toolbox-start-scan"
        >
          {isChecking ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <RefreshCcwIcon className="size-4" />
          )}
          {t("TOOLBOX_START_SCAN")}
        </Button>
      )
    }

    if (isAllSuccess) {
      return (
        <p className="text-sm text-muted-foreground" title="toolbox-success-tips">
          {t("TOOLBOX_SUCCESS_TIPS")}
        </p>
      )
    }

    if (canFixLength !== 0) {
      return (
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={isFixing || isChecking}
          onClick={handleFix}
          title="toolbox-start-fix"
        >
          {isFixing ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <WrenchIcon className="size-4" />
          )}
          {t("TOOLBOX_START_FIX")}
        </Button>
      )
    }

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t("TOOLBOX_CANT_AUTO_FIX")}</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full"
          disabled={isChecking || isFixing}
          onClick={handleCheck}
          title="toolbox-re-scan"
        >
          <RefreshCcwIcon className="size-4" />
          {t("TOOLBOX_RE_SCAN")}
        </Button>
      </div>
    )
  }

  return (
    <UtilityWindowLayout page="toolbox">
      <AppMainCard className="h-(--app-utility-shell-height) w-full flex-none rounded-xl border-(--app-panel-border) bg-(--app-panel-bg) px-6 py-5">
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src="/roundLogo.png"
                alt="PicGo Toolbox"
                className="size-16 object-cover"
              />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold">{t("TOOLBOX_TITLE")}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("TOOLBOX_SUB_TITLE")}
                </p>
              </div>
            </div>

            <div className="shrink-0">{renderPrimaryAction()}</div>
          </header>

          <section className="mt-5" title="toolbox-progress">
            <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <ScrollArea className="mt-5 min-h-0 flex-1">
            <div className="space-y-2 pr-2">
              {items.map((item) => {
                const expanded = activeType === item.type
                return (
                  <section
                    key={item.type}
                    className="border-border/70 rounded-lg border bg-card/30"
                    title={`toolbox-item-${item.type}`}
                  >
                    <button
                      type="button"
                      className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors"
                      onClick={() =>
                        setActiveType((currentType) =>
                          currentType === item.type ? null : item.type
                        )
                      }
                    >
                      <span className="min-w-0 truncate">{t(item.titleKey)}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <ToolboxStatusIcon status={item.status} />
                        <ChevronDownIcon
                          className={cn(
                            "text-muted-foreground size-4 transition-transform",
                            expanded ? "rotate-180" : ""
                          )}
                        />
                      </span>
                    </button>

                    {expanded ? (
                      <div className="px-4 pb-3">
                        <div className="bg-border/60 mb-3 h-px w-full" />
                        <p className="text-muted-foreground text-sm leading-6">
                          {item.messageKey
                            ? t(item.messageKey, item.messageVariables)
                            : ""}
                        </p>
                        {item.handlerTextKey && item.value ? (
                          <Button
                            type="button"
                            size="xs"
                            variant="secondary"
                            className="mt-2"
                            onClick={() => handleOpenPath(item.value)}
                          >
                            {t(item.handlerTextKey)}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </AppMainCard>
    </UtilityWindowLayout>
  )
}
