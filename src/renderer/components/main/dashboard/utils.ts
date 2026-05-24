import { IPasteStyle } from "~/universal/types/enum"
import { extractHttpUrlsFromText } from "#/utils/common"
import { LINK_FORMAT, type LinkFormat } from "@/types/dashboard"
import type {
  UploaderSwitcherProviderItem,
  UploaderSwitcherValue,
} from "./uploader-switcher"
import type {
  AppConfig,
  ProviderUploaderSummary,
} from "../providers/types"

const LINK_FORMAT_TO_PASTE_STYLE: Record<LinkFormat, IPasteStyle> = {
  [LINK_FORMAT.MARKDOWN]: IPasteStyle.MARKDOWN,
  [LINK_FORMAT.HTML]: IPasteStyle.HTML,
  [LINK_FORMAT.URL]: IPasteStyle.URL,
  [LINK_FORMAT.UBB]: IPasteStyle.UBB,
  [LINK_FORMAT.CUSTOM]: IPasteStyle.CUSTOM,
}

const PASTE_STYLE_TO_LINK_FORMAT: Record<string, LinkFormat> = Object.fromEntries(
  Object.entries(LINK_FORMAT_TO_PASTE_STYLE).map(([format, style]) => [style, format as LinkFormat])
)

export function resolveLinkFormat(pasteStyle: string | undefined): LinkFormat {
  if (!pasteStyle) return LINK_FORMAT.MARKDOWN
  return PASTE_STYLE_TO_LINK_FORMAT[pasteStyle] ?? LINK_FORMAT.MARKDOWN
}

export function resolvePasteStyle(linkFormat: LinkFormat): IPasteStyle {
  return LINK_FORMAT_TO_PASTE_STYLE[linkFormat]
}

/** 从剪贴板读取并抽取 HTTP URL，做 URL 上传对话框的初始值。读不到剪贴板权限就返回空串。 */
export async function buildUrlDialogInitialValue(): Promise<string> {
  try {
    const clipboardText = await navigator.clipboard.readText()
    return extractHttpUrlsFromText(clipboardText).join("\n")
  } catch {
    return ""
  }
}

function buildProviderConfigs(
  appConfig: AppConfig,
  providerId: string
): UploaderSwitcherProviderItem["configs"] {
  return (appConfig.uploader[providerId]?.configList ?? []).map((config) => ({
    id: config._id,
    name: config._configName,
  }))
}

export function buildVisibleProviderOptions(
  providers: ProviderUploaderSummary[],
  appConfig: AppConfig | null
): UploaderSwitcherProviderItem[] {
  if (appConfig) {
    const providerSummaryMap = new Map(
      providers.map((provider) => [provider.id, provider] as const)
    )

    return appConfig.picBed.list
      .filter((provider) => provider.visible !== false)
      .map((provider) => {
        const summary = providerSummaryMap.get(provider.type)

        return {
          id: provider.type,
          name: summary?.name ?? provider.name,
          configs: buildProviderConfigs(appConfig, provider.type),
        }
      })
  }

  return providers
    .filter((provider) => provider.visible !== false)
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      configs: [],
    }))
}

export function resolveCurrentSwitcherValue(
  providerOptions: UploaderSwitcherProviderItem[],
  appConfig: AppConfig | null
): UploaderSwitcherValue | null {
  if (providerOptions.length === 0) {
    return null
  }

  const defaultProviderId = appConfig?.picBed.uploader
  const preferredProvider = providerOptions.find(
    (provider) => provider.id === defaultProviderId
  )
  const activeProvider = preferredProvider ?? providerOptions[0]

  if (!activeProvider) {
    return null
  }

  const activeConfigState = appConfig?.uploader[activeProvider.id]
  const defaultConfigId = activeConfigState?.defaultId
  const preferredConfig = activeProvider.configs.find(
    (config) => config.id === defaultConfigId
  )
  const activeConfig = preferredConfig ?? activeProvider.configs[0]

  if (!activeConfig) {
    return null
  }

  return {
    providerId: activeProvider.id,
    providerName: activeProvider.name,
    configId: activeConfig.id,
    configName: activeConfig.name,
  }
}
