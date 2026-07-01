import {
  buildConfigPatch,
  buildFormValues,
  validateRequiredFields,
  type ProviderFormValues,
} from "./utils"
import { defaultSettingsConfig } from "@/components/main/settings/utils"
import type {
  AppConfig,
  ProviderConnectionTestResult,
  ProviderPluginConfig,
  ProviderUploaderConfigItem,
  ProviderUploaderConfigList,
  ProviderAppStateSnapshot,
  ProviderUploaderSchema,
  ProviderUploaderSummary,
} from "./types"

interface ProviderUploaderStoreItem {
  summary: Omit<ProviderUploaderSummary, "isDefaultUploader">
  schema: ProviderPluginConfig[]
  configState: ProviderUploaderConfigList
  source?: "builtin" | "plugin"
}

interface MutateResult {
  selectedId: string | null
}

interface ExternalUploaderPayload {
  id: string
  name: string
  schema: ProviderPluginConfig[]
  configState: ProviderUploaderConfigList
  visible?: boolean
}

interface RemoveUploaderResult {
  removed: boolean
  fallbackUploaderId: string
}

const mockLatency = {
  Base: 240,
  Jitter: 120,
} as const

const initialTimestamp = 1739145600000

function toTimestamp(offsetMinutes: number) {
  return initialTimestamp + offsetMinutes * 60_000
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

const store = new Map<string, ProviderUploaderStoreItem>([
  [
    "github",
    {
      summary: { id: "github", name: "GitHub", visible: true },
      schema: [
        {
          name: "repo",
          type: "input",
          alias: "Set Repo Name",
          message: "Ex. username/repo",
          default: "",
          required: true,
        },
        {
          name: "branch",
          type: "input",
          alias: "Set Branch",
          message: "Ex. main",
          default: "master",
          required: true,
        },
        {
          name: "token",
          type: "password",
          alias: "Set Token",
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
          message: "Ex. https://test.com",
          default: "",
          required: false,
        },
      ],
      configState: {
        defaultId: "github-1",
        configList: [
          createConfigItem("github-1", "Default", toTimestamp(12), {
            repo: "molunerfinn/picgo",
            branch: "main",
            token: "ghp_xxx_example_token",
            path: "uploads/",
            customUrl: "",
          }),
          createConfigItem("github-2", "Backup", toTimestamp(48), {
            repo: "example/backups",
            branch: "main",
            token: "ghp_xxx_backup_token",
            path: "backup/",
            customUrl: "https://cdn.example.com",
          }),
        ],
      },
    },
  ],
  [
    "smms",
    {
      summary: { id: "smms", name: "SM.MS", visible: true },
      schema: [
        {
          name: "token",
          type: "password",
          alias: "Set Token",
          message: "api token",
          default: "",
          required: true,
        },
        {
          name: "backupDomain",
          type: "input",
          alias: "Set Backup Upload Domain",
          message: "Ex. smms.app",
          default: "",
          required: false,
        },
      ],
      configState: {
        defaultId: "smms-1",
        configList: [
          createConfigItem("smms-1", "Default", toTimestamp(84), {
            token: "smms_token_example",
            backupDomain: "smms.app",
          }),
        ],
      },
    },
  ],
  [
    "qiniu",
    {
      summary: { id: "qiniu", name: "Qiniu", visible: true },
      schema: [
        {
          name: "accessKey",
          type: "input",
          alias: "Set AccessKey",
          default: "",
          required: true,
        },
        {
          name: "secretKey",
          type: "password",
          alias: "Set SecretKey",
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
          name: "url",
          type: "input",
          alias: "Set URL",
          message: "Ex. https://xxx.yyy.glb.clouddn.com",
          default: "",
          required: true,
        },
        {
          name: "area",
          type: "input",
          alias: "Set Area",
          message: "Ex. z0",
          default: "",
          required: true,
        },
        {
          name: "options",
          type: "input",
          alias: "Set URL Suffix",
          message: "Ex. ?imageslim",
          default: "",
          required: false,
        },
        {
          name: "path",
          type: "input",
          alias: "Set Path",
          message: "Ex. test/",
          default: "",
          required: false,
        },
      ],
      configState: {
        defaultId: "qiniu-1",
        configList: [
          createConfigItem("qiniu-1", "CDN", toTimestamp(102), {
            accessKey: "qiniu_access_key",
            secretKey: "qiniu_secret_key",
            bucket: "picgo-assets",
            url: "https://cdn.example.com",
            area: "z0",
            options: "",
            path: "uploads/",
          }),
        ],
      },
    },
  ],
  [
    "upyun",
    {
      summary: { id: "upyun", name: "Upyun", visible: true },
      schema: [
        {
          name: "bucket",
          type: "input",
          alias: "Set Bucket",
          default: "",
          required: true,
        },
        {
          name: "operator",
          type: "input",
          alias: "Set Operator",
          message: "Ex. me",
          default: "",
          required: true,
        },
        {
          name: "password",
          type: "password",
          alias: "Set Operator Password",
          message: "Please type the operator password",
          default: "",
          required: true,
        },
        {
          name: "url",
          type: "input",
          alias: "Set URL",
          message: "Ex. http://xxx.test.upcdn.net",
          default: "",
          required: true,
        },
        {
          name: "options",
          type: "input",
          alias: "Set URL Suffix",
          message: "Ex. !imgslim",
          default: "",
          required: false,
        },
        {
          name: "path",
          type: "input",
          alias: "Set Path",
          message: "Ex. test/",
          default: "",
          required: false,
        },
      ],
      configState: {
        defaultId: "upyun-1",
        configList: [
          createConfigItem("upyun-1", "Main", toTimestamp(128), {
            bucket: "picgo",
            operator: "picgo-operator",
            password: "upyun_operator_password",
            url: "http://cdn.example.upcdn.net",
            options: "",
            path: "",
          }),
        ],
      },
    },
  ],
  [
    "aliyun",
    {
      summary: { id: "aliyun", name: "Ali Cloud", visible: true },
      schema: [
        {
          name: "accessKeyId",
          type: "input",
          alias: "Set KeyId",
          default: "",
          required: true,
        },
        {
          name: "accessKeySecret",
          type: "password",
          alias: "Set KeySecret",
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
          message: "Ex. https://test.com",
          default: "",
          required: false,
        },
        {
          name: "options",
          type: "input",
          alias: "Set URL Suffix",
          message: "Ex. ?x-oss-process=xxx",
          default: "",
          required: false,
        },
      ],
      configState: {
        defaultId: "aliyun-1",
        configList: [
          createConfigItem("aliyun-1", "Blog Assets", toTimestamp(156), {
            accessKeyId: "aliyun_access_key_id",
            accessKeySecret: "aliyun_access_key_secret",
            bucket: "picgo-blog-assets",
            area: "oss-cn-shanghai",
            path: "images/",
            customUrl: "",
            options: "",
          }),
        ],
      },
    },
  ],
  [
    "imgur",
    {
      summary: { id: "imgur", name: "Imgur", visible: true },
      schema: [
        {
          name: "clientId",
          type: "input",
          alias: "Set ClientId",
          default: "",
          required: true,
        },
        {
          name: "proxy",
          type: "input",
          alias: "Set Proxy",
          message: "Ex. http://127.0.0.1:1080",
          default: "",
          required: false,
        },
      ],
      configState: {
        defaultId: "",
        configList: [],
      },
    },
  ],
  [
    "tcyun",
    {
      summary: { id: "tcyun", name: "Tencent Cloud", visible: true },
      schema: [
        {
          name: "version",
          type: "list",
          alias: "Choose COS version",
          choices: ["v4", "v5"],
          default: "v5",
          required: false,
        },
        {
          name: "secretId",
          type: "input",
          alias: "Set SecretId",
          default: "",
          required: true,
        },
        {
          name: "secretKey",
          type: "password",
          alias: "Set SecretKey",
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
          name: "appId",
          type: "input",
          alias: "Set AppId",
          message: "Ex. 1234567890",
          default: "",
          required: true,
        },
        {
          name: "area",
          type: "input",
          alias: "Set Area",
          message: "Ex. ap-beijing",
          default: "",
          required: true,
        },
        {
          name: "endpoint",
          type: "input",
          alias: "Set Endpoint",
          message: "Ex. cos-internal.accelerate.tencentcos.cn",
          default: "",
          required: false,
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
          message: "Ex. http://test.com",
          default: "",
          required: false,
        },
        {
          name: "options",
          type: "input",
          alias: "Set URL Suffix",
          message: "Ex. ?imageMogr2",
          default: "",
          required: false,
        },
        {
          name: "slim",
          type: "confirm",
          alias: "Set ImageSlim",
          tips: "Image extremely intelligent compression, please refer to the [document description](https://cloud.tencent.com/document/product/436/49259)",
          default: false,
          required: false,
          confirmText: "OPEN",
          cancelText: "CLOSE",
        },
      ],
      configState: {
        defaultId: "tcyun-1",
        configList: [
          createConfigItem("tcyun-1", "Default", toTimestamp(188), {
            version: "v5",
            secretId: "tencent_secret_id",
            secretKey: "tencent_secret_key",
            bucket: "picgo-1300000000",
            appId: "1300000000",
            area: "ap-guangzhou",
            endpoint: "",
            path: "",
            customUrl: "",
            options: "",
            slim: false,
          }),
        ],
      },
    },
  ],
])

Array.from(store.values()).forEach((item) => {
  if (!item.source) {
    item.source = "builtin"
  }
})

let idSeed = 100
let defaultUploaderId = "smms"

function nextId(uploaderId: string) {
  idSeed += 1
  return `${uploaderId}-${idSeed}`
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function resolveUploader(uploaderId: string) {
  const uploader = store.get(uploaderId)

  if (!uploader) {
    throw new Error("Uploader not found")
  }

  return uploader
}

function resolveConfig(
  uploader: ProviderUploaderStoreItem,
  configId: string
): ProviderUploaderConfigItem {
  const config = uploader.configState.configList.find((item) => item._id === configId)

  if (!config) {
    throw new Error("Config not found")
  }

  return config
}

async function waitForMock() {
  const delayMs = mockLatency.Base + Math.floor(Math.random() * mockLatency.Jitter)
  await new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs)
  })
}

function resolveSelectedId(configState: ProviderUploaderConfigList) {
  if (configState.configList.length === 0) {
    return null
  }

  if (configState.defaultId) {
    return configState.defaultId
  }

  return configState.configList[0]?._id ?? null
}

function resolveFirstAvailableUploaderId() {
  const firstVisible = Array.from(store.values()).find((item) => item.summary.visible)

  if (firstVisible) {
    return firstVisible.summary.id
  }

  const firstAny = Array.from(store.values())[0]
  return firstAny?.summary.id ?? ""
}

function normalizeDefaultConfigId(configState: ProviderUploaderConfigList) {
  if (configState.configList.length === 0) {
    return ""
  }

  const hasDefault = configState.configList.some(
    (config) => config._id === configState.defaultId
  )

  if (hasDefault) {
    return configState.defaultId
  }

  return configState.configList[0]?._id ?? ""
}

function createDefaultConfigValues(schema: ProviderPluginConfig[]) {
  return buildFormValues(schema)
}

function extractConfigValues(config: ProviderUploaderConfigItem) {
  return Object.fromEntries(
    Object.entries(config).filter(([key]) => !key.startsWith("_"))
  )
}

function buildUploaderSummaries(): ProviderUploaderSummary[] {
  return Array.from(store.values()).map((item) => ({
    ...cloneValue(item.summary),
    isDefaultUploader: item.summary.id === defaultUploaderId,
  }))
}

function buildProviderSchemas() {
  const providerSchemas: Record<string, ProviderUploaderSchema> = {}

  Array.from(store.values()).forEach((item) => {
    providerSchemas[item.summary.id] = {
      id: item.summary.id,
      name: item.summary.name,
      config: cloneValue(item.schema),
    }
  })

  return providerSchemas
}

function buildAppConfig(): AppConfig {
  const uploaderConfig: Record<string, ProviderUploaderConfigList> = {}
  const picBedList = buildUploaderSummaries().map((uploader) => ({
    type: uploader.id,
    name: uploader.name,
    visible: uploader.visible,
  }))

  Array.from(store.values()).forEach((item) => {
    uploaderConfig[item.summary.id] = cloneValue(item.configState)
  })

  return {
    picBed: {
      uploader: defaultUploaderId,
      current: defaultUploaderId,
      transformer: "path",
      list: picBedList,
    },
    uploader: uploaderConfig,
    settings: cloneValue(defaultSettingsConfig),
    picgoPlugins: {},
    plugins: {},
    transformer: {},
    needReload: false,
  }
}

function buildProviderAppStateSnapshot(): ProviderAppStateSnapshot {
  return {
    appConfig: buildAppConfig(),
    providers: buildUploaderSummaries(),
    providerSchemas: buildProviderSchemas(),
  }
}

const initialStoreEntries = cloneValue(Array.from(store.entries()))
const initialDefaultUploaderId = defaultUploaderId
const initialIdSeed = idSeed

function restoreMockState() {
  store.clear()

  initialStoreEntries.forEach(([id, entry]) => {
    store.set(id, cloneValue(entry))
  })

  defaultUploaderId = initialDefaultUploaderId
  idSeed = initialIdSeed
}

export const providerMockApi = {
  async getProviderAppState(): Promise<ProviderAppStateSnapshot> {
    await waitForMock()
    return buildProviderAppStateSnapshot()
  },

  async getUploaderList(): Promise<ProviderUploaderSummary[]> {
    await waitForMock()
    return buildUploaderSummaries()
  },

  async setUploaderVisibility(uploaderId: string, visible: boolean) {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    uploader.summary.visible = visible
  },

  async setAllUploaderVisibility(visible: boolean) {
    await waitForMock()

    Array.from(store.values()).forEach((item) => {
      item.summary.visible = visible
    })
  },

  async resetMockState() {
    await waitForMock()
    restoreMockState()
  },

  async upsertExternalUploader(payload: ExternalUploaderPayload) {
    await waitForMock()

    const normalizedConfigState = cloneValue(payload.configState)
    normalizedConfigState.defaultId = normalizeDefaultConfigId(normalizedConfigState)

    store.set(payload.id, {
      source: "plugin",
      summary: {
        id: payload.id,
        name: payload.name,
        visible: payload.visible ?? true,
      },
      schema: cloneValue(payload.schema),
      configState: normalizedConfigState,
    })
  },

  async removeUploader(uploaderId: string): Promise<RemoveUploaderResult> {
    await waitForMock()

    const existed = store.delete(uploaderId)

    if (defaultUploaderId === uploaderId) {
      defaultUploaderId = resolveFirstAvailableUploaderId()
    }

    return {
      removed: existed,
      fallbackUploaderId: defaultUploaderId,
    }
  },

  async getFirstAvailableUploaderId() {
    await waitForMock()
    return resolveFirstAvailableUploaderId()
  },

  async setDefaultUploader(uploaderId: string) {
    await waitForMock()

    resolveUploader(uploaderId)
    defaultUploaderId = uploaderId
  },

  async getUploaderConfigList(uploaderId: string): Promise<ProviderUploaderConfigList> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    return cloneValue(uploader.configState)
  },

  async getUploaderConfigSchema(uploaderId: string): Promise<ProviderUploaderSchema> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    return cloneValue({
      id: uploader.summary.id,
      name: uploader.summary.name,
      config: uploader.schema,
    })
  },

  async createConfig(uploaderId: string, configName: string): Promise<MutateResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    const now = Date.now()
    const nextConfigId = nextId(uploaderId)
    const defaultValues = createDefaultConfigValues(uploader.schema)

    uploader.configState.configList.push(
      createConfigItem(nextConfigId, configName, now, defaultValues)
    )

    if (!uploader.configState.defaultId) {
      uploader.configState.defaultId = nextConfigId
    }

    return { selectedId: nextConfigId }
  },

  async renameConfig(
    uploaderId: string,
    configId: string,
    configName: string
  ): Promise<MutateResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    const target = resolveConfig(uploader, configId)

    target._configName = configName
    target._updatedAt = Date.now()

    return { selectedId: configId }
  },

  async copyConfig(
    uploaderId: string,
    configId: string,
    configName: string
  ): Promise<MutateResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    const source = resolveConfig(uploader, configId)
    const now = Date.now()
    const nextConfigId = nextId(uploaderId)
    const sourceValues = extractConfigValues(source)

    uploader.configState.configList.push(
      createConfigItem(nextConfigId, configName, now, sourceValues)
    )

    return { selectedId: nextConfigId }
  },

  async deleteConfig(uploaderId: string, configId: string): Promise<MutateResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)

    if (uploader.configState.configList.length <= 1) {
      throw new Error("Cannot delete the last config")
    }

    uploader.configState.configList = uploader.configState.configList.filter(
      (item) => item._id !== configId
    )

    uploader.configState.defaultId =
      uploader.configState.defaultId === configId
        ? uploader.configState.configList[0]?._id ?? ""
        : uploader.configState.defaultId

    return { selectedId: resolveSelectedId(uploader.configState) }
  },

  async setDefaultConfig(uploaderId: string, configId: string): Promise<MutateResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    resolveConfig(uploader, configId)
    uploader.configState.defaultId = configId

    return { selectedId: configId }
  },

  async saveConfig(
    uploaderId: string,
    configId: string,
    formValues: ProviderFormValues
  ): Promise<MutateResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    const target = resolveConfig(uploader, configId)
    const patch = buildConfigPatch(uploader.schema, formValues)

    Object.assign(target, patch)
    target._updatedAt = Date.now()

    return { selectedId: configId }
  },

  async testConnection(
    uploaderId: string,
    formValues: ProviderFormValues
  ): Promise<ProviderConnectionTestResult> {
    await waitForMock()

    const uploader = resolveUploader(uploaderId)
    const missingRequiredFields = validateRequiredFields(uploader.schema, formValues)

    // Mock-only behavior for v3 exploration: required fields gate success.
    return {
      success: missingRequiredFields.length === 0,
      missingRequiredFields,
    }
  },
}
