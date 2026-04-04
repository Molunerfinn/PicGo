import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FolderSearch2Icon,
  LoaderCircleIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react"

import { AppMainCard } from "@/components/common/app-main-card"
import { toolboxPageAdapter } from "@/adapters/toolbox-page"
import { useIPCOn } from "@/hooks/useIPC"
import { UtilityWindowLayout } from "@/components/independent-window/utility-window-layout"
import { resolveIndependentWindowErrorMessage } from "@/components/independent-window/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  IRPCActionType,
  IToolboxItemCheckStatus,
  IToolboxItemType
} from "~/universal/types/enum"

type ToolboxHandlerTextKey = "SETTINGS_OPEN_CONFIG_FILE" | "OPEN_FILE_PATH"
type ToolboxTitleKey =
  | "TOOLBOX_CHECK_CONFIG_FILE_BROKEN"
  | "TOOLBOX_CHECK_GALLERY_FILE_BROKEN"
  | "TOOLBOX_CHECK_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD"
  | "TOOLBOX_CHECK_PROBLEM_WITH_PROXY"

interface ToolboxItemState {
  type: IToolboxItemType
  titleKey: ToolboxTitleKey
  status: IToolboxItemCheckStatus
  messageKey: string
  messageVariables?: Record<string, string>
  value: string
  hasNoFixMethod?: boolean
  handlerTextKey?: ToolboxHandlerTextKey
}

function ToolboxStatusIcon({
  status,
}: {
  status: ToolboxItemState["status"]
}) {
  if (status === IToolboxItemCheckStatus.LOADING) {
    return <LoaderCircleIcon className="size-4 animate-spin text-primary" />
  }

  if (status === IToolboxItemCheckStatus.SUCCESS) {
    return <CheckCircle2Icon className="size-4 text-green-500" />
  }

  if (status === IToolboxItemCheckStatus.ERROR) {
    return <AlertCircleIcon className="size-4 text-destructive" />
  }

  return <FolderSearch2Icon className="size-4 text-muted-foreground" />
}

function applyToolboxResult(
  currentItems: ToolboxItemState[],
  result: IToolboxCheckRes
): ToolboxItemState[] {
  return currentItems.map((item) => {
    if (item.type !== result.type) {
      return item
    }

    return {
      ...item,
      status: result.status,
      messageKey: result.msg ?? "",
      value: typeof result.value === "string" ? result.value : "",
    }
  })
}

export function PicGoToolboxPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ToolboxItemState[]>([
    {
      type: IToolboxItemType.IS_CONFIG_FILE_BROKEN,
      titleKey: "TOOLBOX_CHECK_CONFIG_FILE_BROKEN",
      status: IToolboxItemCheckStatus.INIT,
      messageKey: "",
      value: "",
      handlerTextKey: "SETTINGS_OPEN_CONFIG_FILE",
    },
    {
      type: IToolboxItemType.IS_GALLERY_FILE_BROKEN,
      titleKey: "TOOLBOX_CHECK_GALLERY_FILE_BROKEN",
      status: IToolboxItemCheckStatus.INIT,
      messageKey: "",
      value: "",
    },
    {
      type: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
      titleKey: "TOOLBOX_CHECK_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD",
      status: IToolboxItemCheckStatus.INIT,
      messageKey: "",
      value: "",
      handlerTextKey: "OPEN_FILE_PATH",
    },
    {
      type: IToolboxItemType.HAS_PROBLEM_WITH_PROXY,
      titleKey: "TOOLBOX_CHECK_PROBLEM_WITH_PROXY",
      status: IToolboxItemCheckStatus.INIT,
      messageKey: "",
      value: "",
      hasNoFixMethod: true,
    }
  ])
  const [activeType, setActiveType] = useState<IToolboxItemType | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  useIPCOn(IRPCActionType.TOOLBOX_CHECK_RES, (result: IToolboxCheckRes) => {
    applyResult(result)
    if (result.status === IToolboxItemCheckStatus.ERROR) {
      setActiveType(result.type)
    }
  })

  const progress =
    items.length === 0
      ? 0
      : Math.round(
        (items.filter(
          (item) =>
            item.status !== IToolboxItemCheckStatus.INIT &&
            item.status !== IToolboxItemCheckStatus.LOADING
        ).length /
        items.length) *
        100
      )

  const isAllSuccess =
    items.length > 0 &&
    items.every((item) => item.status === IToolboxItemCheckStatus.SUCCESS)

  const canFixItems = items.filter(
    (item) =>
      item.status === IToolboxItemCheckStatus.ERROR && item.hasNoFixMethod !== true
  )
  const canFixLength = canFixItems.length

  const applyResult = (result: IToolboxCheckRes) => {
    setItems((currentItems) => applyToolboxResult(currentItems, result))
  }

  const handleCheck = async () => {
    if (items.length === 0 || isChecking || isFixing) {
      return
    }

    setActiveType(null)
    setIsChecking(true)
    setItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        status: IToolboxItemCheckStatus.LOADING,
        messageKey: "",
        messageVariables: undefined,
        value: "",
      }))
    )

    try {
      toolboxPageAdapter.runCheck()
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
        const result = await toolboxPageAdapter.fixItem(type)
        applyResult(result)
      }

      console.info("[toolbox-page] toolbox fix completed")
      const shouldRestartNow = window.confirm(t("TOOLBOX_FIX_DONE_NEED_RELOAD"))
      if (shouldRestartNow) {
        toolboxPageAdapter.reloadApp()
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
      toolboxPageAdapter.openFile(path)
      console.info(`[toolbox-page] opened path: ${path}`)
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
          disabled={isChecking || isFixing || items.length === 0}
          onClick={handleCheck}
          title="toolbox-start-scan"
        >
          {isChecking ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <SearchIcon className="size-4" />
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
          disabled={isChecking || isFixing}
          onClick={handleCheck}
          title="toolbox-re-scan"
        >
          <SearchIcon className="size-4" />
          {t("TOOLBOX_RE_SCAN")}
        </Button>
      </div>
    )
  }

  return (
    <UtilityWindowLayout page="toolbox">
      <AppMainCard className="flex h-(--app-utility-shell-height) w-full flex-col overflow-hidden rounded-xl border-(--app-panel-border) bg-(--app-panel-bg) px-6 py-5">
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
            <div className="space-y-2 pb-1 pr-2">
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
                            ? t(item.messageKey as never, item.messageVariables)
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
