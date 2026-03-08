import { buildFormValues } from "@/components/main/providers/utils"
import { providerMockApi } from "@/components/main/providers/provider-mock"
import type {
  ProviderPluginConfig,
  ProviderUploaderConfigItem,
} from "@/components/main/providers/types"
import type {
  PluginConfigSectionType,
  PluginImportResult,
  PluginInstalledItem,
  PluginSearchResultItem,
  PluginSnapshot,
  PluginUploaderBridgeConfig,
} from "./types"

interface PluginCatalogItem {
  name: string
  fullName: string
  author: string
  description: string
  version: string
  homepage: string
  gui: boolean
  pluginConfig: ProviderPluginConfig[]
  transformerConfig: {
    name: string
    config: ProviderPluginConfig[]
  }
  guiMenu: Array<{
    label: string
  }>
  readme: string
  uploader?: PluginUploaderBridgeConfig
}

interface InstalledPluginState {
  enabled: boolean
  version: string
  pluginConfigValues: Record<string, unknown>
  transformerConfigValues: Record<string, unknown>
}

interface ReadmeFetchResult {
  content: string | null
  errorMessage: string | null
}

const mockLatency = {
  Base: 220,
  Jitter: 110,
} as const

function toTimestamp(offsetMinutes: number) {
  return 1739232000000 + offsetMinutes * 60_000
}

function createConfigItem(
  id: string,
  name: string,
  timestamp: number,
  values: Record<string, unknown>
): ProviderUploaderConfigItem {
  return {
    _id: id,
    _configName: name,
    _createdAt: timestamp,
    _updatedAt: timestamp,
    ...values,
  }
}

const aliyunUploaderSchema: ProviderPluginConfig[] = [
  {
    name: "accessKeyId",
    type: "input",
    alias: "Set AccessKeyId",
    default: "",
    required: true,
  },
  {
    name: "accessKeySecret",
    type: "password",
    alias: "Set AccessKeySecret",
    default: "",
    required: true,
  },
  {
    name: "bucket",
    type: "input",
    alias: "Set Bucket",
    default: "",
    required: true,
  },
  {
    name: "area",
    type: "input",
    alias: "Set Area",
    message: "Ex. oss-cn-beijing",
    default: "",
    required: true,
  },
  {
    name: "path",
    type: "input",
    alias: "Set Path",
    message: "Ex. test/",
    default: "",
    required: false,
  },
  {
    name: "customUrl",
    type: "input",
    alias: "Set Custom URL",
    message: "Ex. https://cdn.example.com",
    default: "",
    required: false,
  },
  {
    name: "options",
    type: "input",
    alias: "Set URL Suffix",
    message: "Ex. ?x-oss-process=style/xxx",
    default: "",
    required: false,
  },
]

const pluginCatalog = new Map<string, PluginCatalogItem>([
  [
    "picgo-plugin-pic-migrater",
    {
      name: "pic-migrater",
      fullName: "picgo-plugin-pic-migrater",
      author: "Molunerfinn",
      description:
        "Migrate markdown image URLs from one uploader config to another.",
      version: "1.3.3",
      homepage: "https://github.com/PicGo/picgo-plugin-pic-migrater",
      gui: true,
      pluginConfig: [
        {
          name: "newFileSuffix",
          type: "input",
          alias: "New file suffix",
          message: "_new",
          default: "_new",
          required: true,
        },
        {
          name: "include",
          type: "input",
          alias: "Include",
          message: "Ex. docs/**/*.md",
          default: "",
          required: false,
        },
        {
          name: "exclude",
          type: "input",
          alias: "Exclude",
          message: "Ex. README.md",
          default: "",
          required: false,
        },
        {
          name: "oldContentWriteToNewFile",
          type: "confirm",
          alias: "Write to new file",
          default: false,
          required: false,
        },
      ],
      transformerConfig: {
        name: "",
        config: [],
      },
      guiMenu: [
        {
          label: "Choose markdown files",
        },
        {
          label: "Choose folder",
        },
      ],
      readme: [
        "# picgo-plugin-pic-migrater",
        "",
        "Migrate image URLs inside markdown files.",
        "",
        "## Usage",
        "",
        "1. Configure source and target uploader.",
        "2. Trigger migrate action from plugin menu.",
      ].join("\n"),
    },
  ],
  [
    "picgo-plugin-image-tools",
    {
      name: "image-tools",
      fullName: "picgo-plugin-image-tools",
      author: "PicGo Team",
      description: "Optimize images and transform output links before upload.",
      version: "0.9.0",
      homepage: "https://github.com/PicGo/picgo-plugin-image-tools",
      gui: true,
      pluginConfig: [
        {
          name: "enableOptimize",
          type: "confirm",
          alias: "Optimize before upload",
          default: true,
          required: false,
        },
        {
          name: "quality",
          type: "input",
          alias: "Quality",
          message: "1-100",
          default: "85",
          required: true,
        },
      ],
      transformerConfig: {
        name: "image-tools-transformer",
        config: [
          {
            name: "enabled",
            type: "confirm",
            alias: "Enable transformer",
            default: true,
            required: false,
          },
          {
            name: "appendHash",
            type: "confirm",
            alias: "Append hash query",
            default: false,
            required: false,
          },
        ],
      },
      guiMenu: [
        {
          label: "Optimize selected images",
        },
      ],
      readme: [
        "# picgo-plugin-image-tools",
        "",
        "Image optimization and output transformer plugin.",
      ].join("\n"),
    },
  ],
  [
    "picgo-plugin-aliyun-oss-uploader",
    {
      name: "aliyun-oss-uploader",
      fullName: "picgo-plugin-aliyun-oss-uploader",
      author: "PicGo Community",
      description: "Provide Aliyun OSS uploader for PicGo v3.",
      version: "1.0.2",
      homepage: "https://github.com/PicGo/Awesome-PicGo",
      gui: true,
      pluginConfig: [
        {
          name: "autoSwitchDefault",
          type: "confirm",
          alias: "Auto switch to Aliyun",
          default: false,
          required: false,
        },
      ],
      transformerConfig: {
        name: "",
        config: [],
      },
      guiMenu: [],
      readme: [
        "# picgo-plugin-aliyun-oss-uploader",
        "",
        "Install this plugin to register an Aliyun OSS uploader.",
      ].join("\n"),
      uploader: {
        id: "plugin-aliyun-oss",
        name: "Aliyun OSS (Plugin)",
        schema: aliyunUploaderSchema,
        configState: {
          defaultId: "plugin-aliyun-oss-1",
          configList: [
            createConfigItem("plugin-aliyun-oss-1", "Default", toTimestamp(400), {
              accessKeyId: "aliyun_access_key_id",
              accessKeySecret: "aliyun_access_key_secret",
              bucket: "picgo-assets",
              area: "oss-cn-shanghai",
              path: "uploads/",
              customUrl: "",
              options: "",
            }),
          ],
        },
      },
    },
  ],
  [
    "picgo-plugin-watermark",
    {
      name: "watermark",
      fullName: "picgo-plugin-watermark",
      author: "PicGo Community",
      description: "Add watermark to local images before uploading.",
      version: "2.1.0",
      homepage: "https://github.com/PicGo/Awesome-PicGo",
      gui: true,
      pluginConfig: [
        {
          name: "watermarkText",
          type: "input",
          alias: "Watermark text",
          default: "PicGo",
          required: true,
        },
      ],
      transformerConfig: {
        name: "",
        config: [],
      },
      guiMenu: [],
      readme: "",
    },
  ],
])

const installedPluginStates = new Map<string, InstalledPluginState>([
  [
    "picgo-plugin-pic-migrater",
    {
      enabled: true,
      version: "1.3.3",
      pluginConfigValues: {
        newFileSuffix: "_new",
        include: "",
        exclude: "",
        oldContentWriteToNewFile: false,
      },
      transformerConfigValues: {},
    },
  ],
  [
    "picgo-plugin-image-tools",
    {
      enabled: true,
      version: "0.9.0",
      pluginConfigValues: {
        enableOptimize: true,
        quality: "85",
      },
      transformerConfigValues: {
        enabled: true,
        appendHash: false,
      },
    },
  ],
])

let needReload = false
let currentTransformer = "path"

const initialInstalledPluginStates = cloneValue(Array.from(installedPluginStates.entries()))
const initialNeedReload = needReload
const initialCurrentTransformer = currentTransformer

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

async function waitForMock() {
  const delayMs = mockLatency.Base + Math.floor(Math.random() * mockLatency.Jitter)
  await new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs)
  })
}

function buildLogoUrl(fullName: string) {
  return `https://cdn.jsdelivr.net/npm/${fullName}/logo.png`
}

function resolveCatalogItem(fullName: string) {
  const item = pluginCatalog.get(fullName)

  if (item) {
    return item
  }

  const normalizedName = fullName.startsWith("picgo-plugin-")
    ? fullName.replace("picgo-plugin-", "")
    : fullName

  return {
    name: normalizedName,
    fullName,
    author: "Local",
    description: "Local imported plugin",
    version: "0.0.1",
    homepage: "",
    gui: true,
    pluginConfig: [],
    transformerConfig: {
      name: "",
      config: [],
    },
    guiMenu: [],
    readme: "",
  } satisfies PluginCatalogItem
}

function buildInstalledPlugin(fullName: string): PluginInstalledItem {
  const catalog = resolveCatalogItem(fullName)
  const state = installedPluginStates.get(fullName)

  if (!state) {
    throw new Error("Plugin is not installed")
  }

  return {
    name: catalog.name,
    fullName,
    author: catalog.author,
    description: catalog.description,
    logo: buildLogoUrl(fullName),
    version: state.version,
    gui: catalog.gui,
    homepage: catalog.homepage,
    enabled: state.enabled,
    hasInstall: true,
    guiMenu: cloneValue(catalog.guiMenu),
    config: {
      plugin: {
        name: fullName,
        fullName,
        config: cloneValue(catalog.pluginConfig),
      },
      transformer: {
        name: catalog.transformerConfig.name,
        fullName: catalog.transformerConfig.name,
        config: cloneValue(catalog.transformerConfig.config),
      },
    },
    uploader: catalog.uploader ? cloneValue(catalog.uploader) : undefined,
  }
}

function buildInstalledPlugins() {
  return Array.from(installedPluginStates.keys()).map((fullName) =>
    buildInstalledPlugin(fullName)
  )
}

function buildPicGoPluginsState() {
  const configMap: Record<string, boolean> = {}

  installedPluginStates.forEach((state, fullName) => {
    configMap[fullName] = state.enabled
  })

  return configMap
}

function buildPluginConfigsState() {
  const configMap: Record<string, Record<string, unknown>> = {}

  installedPluginStates.forEach((state, fullName) => {
    configMap[fullName] = cloneValue(state.pluginConfigValues)
  })

  return configMap
}

function buildTransformerConfigsState() {
  const configMap: Record<string, Record<string, unknown>> = {}

  installedPluginStates.forEach((state, fullName) => {
    const catalog = resolveCatalogItem(fullName)
    const transformerName = catalog.transformerConfig.name

    if (!transformerName) {
      return
    }

    configMap[transformerName] = cloneValue(state.transformerConfigValues)
  })

  return configMap
}

function buildSnapshot(): PluginSnapshot {
  return {
    installedPlugins: buildInstalledPlugins(),
    picgoPlugins: buildPicGoPluginsState(),
    pluginConfigs: buildPluginConfigsState(),
    transformerConfigs: buildTransformerConfigsState(),
    currentTransformer,
    needReload,
  }
}

function normalizePluginName(input: string) {
  const raw = input.trim()

  if (raw.length === 0) {
    return ""
  }

  return raw.startsWith("picgo-plugin-") ? raw : `picgo-plugin-${raw}`
}

function parseNextVersion(version: string) {
  const matched = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)?$/)

  if (!matched) {
    return version
  }

  const major = Number(matched[1])
  const minor = Number(matched[2])
  const patch = Number(matched[3]) + 1
  const suffix = matched[4] ?? ""

  return `${major}.${minor}.${patch}${suffix}`
}

async function syncPluginUploader(fullName: string) {
  const catalog = resolveCatalogItem(fullName)
  const state = installedPluginStates.get(fullName)
  const uploader = catalog.uploader

  if (!uploader) {
    return
  }

  if (!state || !state.enabled) {
    await providerMockApi.removeUploader(uploader.id)
    return
  }

  await providerMockApi.upsertExternalUploader({
    id: uploader.id,
    name: uploader.name,
    schema: uploader.schema,
    configState: uploader.configState,
  })
}

function buildSearchResult(fullName: string): PluginSearchResultItem {
  const catalog = resolveCatalogItem(fullName)

  return {
    name: catalog.name,
    fullName,
    author: catalog.author,
    description: catalog.description,
    logo: buildLogoUrl(fullName),
    version: catalog.version,
    homepage: catalog.homepage,
    gui: catalog.gui,
    hasInstall: installedPluginStates.has(fullName),
  }
}

function buildFallbackSearch(query: string) {
  const normalized = normalizePluginName(query).toLowerCase()

  return Array.from(pluginCatalog.keys())
    .filter((fullName) => fullName.includes("picgo-plugin-"))
    .filter((fullName) => fullName.toLowerCase().includes(normalized))
    .map((fullName) => buildSearchResult(fullName))
}

function resolveSearchPayload(payload: unknown) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("objects" in payload) ||
    !Array.isArray((payload as { objects?: unknown[] }).objects)
  ) {
    return []
  }

  const objects = (payload as { objects: unknown[] }).objects

  return objects
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("package" in item)) {
        return []
      }

      const pkg = (item as { package?: unknown }).package

      if (!pkg || typeof pkg !== "object") {
        return []
      }

      const packageName =
        typeof (pkg as { name?: unknown }).name === "string"
          ? (pkg as { name: string }).name
          : ""

      if (!packageName.includes("picgo-plugin-")) {
        return []
      }

      const description =
        typeof (pkg as { description?: unknown }).description === "string"
          ? (pkg as { description: string }).description
          : ""

      if (description.includes("picgo.net") || description.includes("PicGo官方")) {
        return []
      }

      const maintainers = Array.isArray((pkg as { maintainers?: unknown[] }).maintainers)
        ? (pkg as { maintainers: Array<{ username?: string }> }).maintainers
        : []

      const homepage =
        typeof (pkg as { links?: { homepage?: string } }).links?.homepage === "string"
          ? (pkg as { links: { homepage: string } }).links.homepage
          : ""

      const version =
        typeof (pkg as { version?: unknown }).version === "string"
          ? (pkg as { version: string }).version
          : "0.0.0"

      const keywords = Array.isArray((pkg as { keywords?: unknown[] }).keywords)
        ? (pkg as { keywords: unknown[] }).keywords
        : []

      return [
        {
          name: packageName.replace("picgo-plugin-", ""),
          fullName: packageName,
          author: maintainers[0]?.username ?? "",
          description,
          logo: buildLogoUrl(packageName),
          version,
          homepage,
          gui: keywords.includes("picgo-gui-plugin"),
          hasInstall: installedPluginStates.has(packageName),
        } satisfies PluginSearchResultItem,
      ]
    })
}

function getDefaultConfigValues(schema: ProviderPluginConfig[]) {
  return buildFormValues(schema)
}

function normalizeImportedFullName(folderPath: string) {
  const rawName = folderPath.split("/").filter(Boolean).at(-1) ?? "local-plugin"
  return rawName.startsWith("picgo-plugin-") ? rawName : `picgo-plugin-${rawName}`
}

function restoreMockState() {
  installedPluginStates.clear()
  initialInstalledPluginStates.forEach(([fullName, state]) => {
    installedPluginStates.set(fullName, cloneValue(state))
  })
  needReload = initialNeedReload
  currentTransformer = initialCurrentTransformer
}

async function installInternal(fullName: string) {
  if (installedPluginStates.has(fullName)) {
    return buildInstalledPlugin(fullName)
  }

  const catalog = resolveCatalogItem(fullName)
  const pluginConfigValues = getDefaultConfigValues(catalog.pluginConfig)
  const transformerConfigValues = getDefaultConfigValues(
    catalog.transformerConfig.config
  )

  installedPluginStates.set(fullName, {
    enabled: true,
    version: catalog.version,
    pluginConfigValues,
    transformerConfigValues,
  })

  await syncPluginUploader(fullName)
  needReload = true

  return buildInstalledPlugin(fullName)
}

export const pluginMockApi = {
  async getPluginSnapshot() {
    await waitForMock()
    return buildSnapshot()
  },

  async searchPlugins(query: string) {
    await waitForMock()

    const normalized = normalizePluginName(query)

    if (!normalized) {
      return [] as PluginSearchResultItem[]
    }

    try {
      // TODO: Replace direct network request with Electron IPC search adapter.
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(normalized)}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch npm search results")
      }

      const payload = await response.json()
      const parsed = resolveSearchPayload(payload)

      if (parsed.length > 0) {
        return parsed
      }
    } catch {
      return buildFallbackSearch(query)
    }

    return buildFallbackSearch(query)
  },

  async installPlugin(fullName: string) {
    await waitForMock()
    // TODO: Replace in-memory install flow with IPC installPlugin action.
    return installInternal(fullName)
  },

  async importLocalPlugin(folderPath: string): Promise<PluginImportResult> {
    await waitForMock()
    const fullName = normalizeImportedFullName(folderPath)

    if (!pluginCatalog.has(fullName)) {
      pluginCatalog.set(fullName, {
        name: fullName.replace("picgo-plugin-", ""),
        fullName,
        author: "Local",
        description: "Imported local plugin",
        version: "0.0.1",
        homepage: "",
        gui: true,
        pluginConfig: [],
        transformerConfig: {
          name: "",
          config: [],
        },
        guiMenu: [],
        readme: "",
      })
    }

    const installedPlugin = await installInternal(fullName)
    return {
      path: folderPath,
      installedPlugin,
    }
  },

  async setPluginEnabled(fullName: string, enabled: boolean) {
    await waitForMock()
    const state = installedPluginStates.get(fullName)

    if (!state) {
      throw new Error("Plugin is not installed")
    }

    state.enabled = enabled
    await syncPluginUploader(fullName)
    needReload = true

    const transformerName = resolveCatalogItem(fullName).transformerConfig.name

    if (!enabled && transformerName && currentTransformer === transformerName) {
      currentTransformer = "path"
    }
  },

  async updatePlugin(fullName: string) {
    await waitForMock()
    const state = installedPluginStates.get(fullName)

    if (!state) {
      throw new Error("Plugin is not installed")
    }

    state.version = parseNextVersion(state.version)
    needReload = true
    return state.version
  },

  async uninstallPlugin(fullName: string) {
    await waitForMock()
    const existed = installedPluginStates.delete(fullName)

    if (!existed) {
      throw new Error("Plugin is not installed")
    }

    await syncPluginUploader(fullName)

    const transformerName = resolveCatalogItem(fullName).transformerConfig.name
    if (transformerName && currentTransformer === transformerName) {
      currentTransformer = "path"
    }

    needReload = true
  },

  async savePluginConfig(
    fullName: string,
    section: PluginConfigSectionType,
    values: Record<string, unknown>
  ) {
    await waitForMock()
    const state = installedPluginStates.get(fullName)

    if (!state) {
      throw new Error("Plugin is not installed")
    }

    if (section === "config") {
      state.pluginConfigValues = cloneValue(values)
      return
    }

    state.transformerConfigValues = cloneValue(values)
  },

  async togglePluginTransformer(fullName: string) {
    await waitForMock()
    const transformerName = resolveCatalogItem(fullName).transformerConfig.name

    if (!transformerName) {
      return currentTransformer
    }

    currentTransformer =
      currentTransformer === transformerName ? "path" : transformerName
    needReload = true
    return currentTransformer
  },

  async runGuiMenuAction(fullName: string, label: string) {
    await waitForMock()
    return {
      fullName,
      label,
      message: `TODO: invoke guiMenu action "${label}"`,
    }
  },

  async fetchPluginReadme(fullName: string): Promise<ReadmeFetchResult> {
    await waitForMock()

    try {
      // TODO: Replace direct network request with Electron IPC getReadme action.
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(fullName)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch readme for ${fullName}`)
      }

      const payload = await response.json()
      const readme =
        typeof (payload as { readme?: unknown }).readme === "string"
          ? (payload as { readme: string }).readme.trim()
          : ""

      if (readme.length === 0) {
        return {
          content: null,
          errorMessage: null,
        }
      }

      return {
        content: readme,
        errorMessage: null,
      }
    } catch (error) {
      const fallbackReadme = resolveCatalogItem(fullName).readme.trim()

      if (fallbackReadme.length > 0) {
        return {
          content: fallbackReadme,
          errorMessage: null,
        }
      }

      return {
        content: null,
        errorMessage: error instanceof Error ? error.message : "Failed to fetch readme",
      }
    }
  },

  async resetMockState() {
    await waitForMock()
    restoreMockState()
    await providerMockApi.removeUploader("plugin-aliyun-oss")
  },
}
