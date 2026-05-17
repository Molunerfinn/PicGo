import type { AppConfig } from "@/components/main/providers/types"
import {
  pluginDetailTab,
  pluginGearActionKind,
  type PluginDetailTab,
  type PluginGearAction,
  type PluginSearchResultItem,
  type PluginInstalledItem,
  type PluginReadmeState,
} from "./types"

export const pluginDefaultLogoUrl =
  "https://pics.molunerfinn.com/doc/picgo-logo.png"

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function normalizePluginDisplayName(fullName: string) {
  return fullName.startsWith("picgo-plugin-")
    ? fullName.replace("picgo-plugin-", "")
    : fullName
}

export function mapInstalledPluginItem(item: IPicGoPlugin): PluginInstalledItem {
  const rawConfig =
    item.config && typeof item.config === "object" ? item.config : {}
  const pluginSection =
    rawConfig.plugin && typeof rawConfig.plugin === "object"
      ? rawConfig.plugin
      : { name: "", fullName: "", config: [] }
  const transformerSection =
    rawConfig.transformer && typeof rawConfig.transformer === "object"
      ? rawConfig.transformer
      : { name: "", fullName: "", config: [] }
  const uploaderSection =
    rawConfig.uploader && typeof rawConfig.uploader === "object"
      ? rawConfig.uploader
      : null

  return {
    name: item.name,
    fullName: item.fullName,
    author: item.author,
    description: item.description,
    logo: item.logo,
    version: String(item.version),
    gui: item.gui,
    homepage: item.homepage,
    enabled: item.enabled === undefined ? true : item.enabled,
    hasInstall: true,
    guiMenu: item.guiMenu ?? [],
    config: {
      plugin: {
        name: typeof pluginSection.name === "string" ? pluginSection.name : "",
        fullName:
          typeof pluginSection.fullName === "string"
            ? pluginSection.fullName
            : undefined,
        config: Array.isArray(pluginSection.config) ? pluginSection.config : [],
      },
      transformer: {
        name:
          typeof transformerSection.name === "string"
            ? transformerSection.name
            : "",
        fullName:
          typeof transformerSection.fullName === "string"
            ? transformerSection.fullName
            : undefined,
        config: Array.isArray(transformerSection.config)
          ? transformerSection.config
          : [],
      },
    },
    uploader:
      uploaderSection && typeof uploaderSection.name === "string"
        ? {
          id: uploaderSection.name,
          name: uploaderSection.name,
          schema: Array.isArray(uploaderSection.config)
            ? uploaderSection.config
            : [],
          configState: {
            defaultId: "",
            configList: [],
          },
        }
        : undefined,
  }
}

export function mapPluginSearchResult(item: IPicGoPlugin): PluginSearchResultItem {
  return {
    name: item.name,
    fullName: item.fullName,
    author: item.author,
    description: item.description,
    logo: item.logo,
    version: String(item.version),
    homepage: item.homepage,
    gui: item.gui,
    hasInstall: Boolean(item.hasInstall),
  }
}

function normalizeHomepageUrl(url: string) {
  const trimmed = url.trim()

  if (!trimmed) {
    return ""
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`
  }

  return `https://${trimmed}`
}

export function resolvePluginHomepageUrl(
  fullName: string,
  homepageCandidates: Array<string | undefined | null>
) {
  for (const homepage of homepageCandidates) {
    if (!homepage) {
      continue
    }

    const normalized = normalizeHomepageUrl(homepage)
    if (normalized) {
      return normalized
    }
  }

  return `https://www.npmjs.com/package/${fullName}`
}

export function resolvePluginDetailTabs(plugin: PluginInstalledItem | null) {
  if (!plugin) {
    return [pluginDetailTab.Readme]
  }

  const tabs: PluginDetailTab[] = [pluginDetailTab.Readme]

  if (plugin.config.plugin.config.length > 0) {
    tabs.push(pluginDetailTab.Config)
  }

  if (plugin.config.transformer.config.length > 0) {
    tabs.push(pluginDetailTab.Transformer)
  }

  return tabs
}

interface PluginTabJumpResolution {
  shouldSwitchImmediately: boolean
  targetPluginFullName: string
  targetTab: PluginDetailTab
}

export function resolvePluginTabJump(
  currentPluginFullName: string | undefined,
  targetPluginFullName: string,
  targetTab: PluginDetailTab
): PluginTabJumpResolution {
  return {
    shouldSwitchImmediately: currentPluginFullName === targetPluginFullName,
    targetPluginFullName,
    targetTab,
  }
}

export function resolveSupportedPluginTab(
  currentTab: PluginDetailTab,
  availableTabs: PluginDetailTab[]
) {
  if (availableTabs.includes(currentTab)) {
    return currentTab
  }

  return availableTabs[0] ?? pluginDetailTab.Readme
}

export function resolveActivePlugin<T extends { fullName: string }>(
  plugins: Array<T>,
  selectedFullName: string | null
): T | null {
  if (plugins.length === 0) {
    return null
  }

  if (selectedFullName) {
    const selected = plugins.find((plugin) => plugin.fullName === selectedFullName)

    if (selected) {
      return selected
    }
  }

  return plugins[0]
}

export function buildPluginGearActions(
  plugin: PluginInstalledItem,
  currentTransformer: string
) {
  const actions: PluginGearAction[] = [
    {
      id: `${plugin.fullName}-enable`,
      label: "Enable",
      kind: pluginGearActionKind.Enable,
      disabled: plugin.enabled,
    },
    {
      id: `${plugin.fullName}-disable`,
      label: "Disable",
      kind: pluginGearActionKind.Disable,
      disabled: !plugin.enabled,
    },
    {
      id: `${plugin.fullName}-uninstall`,
      label: "Uninstall",
      kind: pluginGearActionKind.Uninstall,
    },
    {
      id: `${plugin.fullName}-update`,
      label: "Update",
      kind: pluginGearActionKind.Update,
    },
  ]

  if (plugin.config.plugin.config.length > 0) {
    actions.push({
      id: `${plugin.fullName}-jump-config`,
      label: "Config",
      kind: pluginGearActionKind.JumpConfig,
    })
  }

  if (plugin.config.transformer.config.length > 0) {
    actions.push({
      id: `${plugin.fullName}-jump-transformer`,
      label: "Transformer",
      kind: pluginGearActionKind.JumpTransformer,
    })

    const transformerName = plugin.config.transformer.name
    const toggleLabel =
      currentTransformer === transformerName
        ? `Disable transformer - ${transformerName}`
        : `Enable transformer - ${transformerName}`

    actions.push({
      id: `${plugin.fullName}-toggle-transformer`,
      label: toggleLabel,
      kind: pluginGearActionKind.ToggleTransformer,
    })
  }

  plugin.guiMenu.forEach((item) => {
    actions.push({
      id: `${plugin.fullName}-gui-${item.label}`,
      label: item.label,
      kind: pluginGearActionKind.GuiMenu,
      guiMenuLabel: item.label,
    })
  })

  return actions
}

export function resolveReadmeState(
  readmeMap: Record<string, PluginReadmeState>,
  fullName: string | undefined
) {
  if (!fullName) {
    return null
  }

  return readmeMap[fullName] ?? null
}

export function buildPluginDeprecationKey(fullName: string, version: string) {
  return `${fullName}@${version}`
}

export function resolveConfigValues(
  appConfig: AppConfig | null,
  plugin: PluginInstalledItem | null,
  tab: PluginDetailTab
) {
  if (!appConfig || !plugin) {
    return {}
  }

  if (tab === pluginDetailTab.Config) {
    return appConfig.plugins[plugin.fullName] ?? {}
  }

  if (tab === pluginDetailTab.Transformer) {
    const transformerName = plugin.config.transformer.name
    return appConfig.transformer[transformerName] ?? {}
  }

  return {}
}
