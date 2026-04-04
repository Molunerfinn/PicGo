import type { ProviderUploaderSummary } from "@/components/main/providers/types"
import type { ValueOf } from "@/types/utils"
import { IPasteStyle, IStartupMode } from "~/universal/types/enum"

export const SettingsSectionIdValues = {
  General: "general",
  Appearance: "appearance",
  UploadWorkflow: "upload-workflow",
  Network: "network",
  Advanced: "advanced",
  About: "about",
} as const
export const settingsSectionId = SettingsSectionIdValues

export type SettingsSectionId =
  ValueOf<typeof SettingsSectionIdValues>

export const SettingsNavItemKindValues = {
  Section: "section",
  Route: "route",
} as const
export const settingsNavItemKind = SettingsNavItemKindValues

export type SettingsNavItemKind =
  ValueOf<typeof SettingsNavItemKindValues>

export const SettingsAppearanceValues = {
  Light: "light",
  Dark: "dark",
  Auto: "auto",
} as const
export const settingsAppearance = SettingsAppearanceValues

export type SettingsAppearance =
  ValueOf<typeof SettingsAppearanceValues>

export interface SettingsServerConfig {
  port: number
  host: string
  enable: boolean
}

export interface SettingsShortcutItem {
  id: string
  name: string
  label: string
  labelKey?: string
  key: string
  enable: boolean
  from: string
}

export interface SettingsShortKeyConfig {
  enable: boolean
  key: string
  name: string
  label: string
}

export type SettingsShortKeyMap = Record<string, SettingsShortKeyConfig>

export interface SettingsUrlRewriteRule {
  match: string
  replace: string
  global: boolean
  ignoreCase: boolean
  enable: boolean
}

export interface SettingsUrlRewriteDraftRule extends SettingsUrlRewriteRule {
  id: string
}

export interface SettingsUrlRewriteConfig {
  rules: SettingsUrlRewriteRule[]
}

export interface SettingsConfigState {
  appearance: SettingsAppearance
  pasteStyle: IPasteStyle
  showUpdateTip: boolean
  autoStart: boolean
  rename: boolean
  autoRename: boolean
  uploadNotification: boolean
  notificationSound: boolean
  miniWindowOnTop: boolean
  logLevel: string[]
  autoCopyUrl: boolean
  checkBetaUpdate: boolean
  useBuiltinClipboard: boolean
  language: string
  logFileSizeLimit: number
  encodeOutputURL: boolean
  showDockIcon: boolean
  showMenubarIcon: boolean
  customLink: string
  npmProxy: string
  npmRegistry: string
  server: SettingsServerConfig
  startupMode: IStartupMode
  shortKey: SettingsShortKeyMap
  urlRewrite: SettingsUrlRewriteConfig
}

export interface SettingsVersionState {
  currentVersion: string
  latestVersion: string | null
}

type SettingsPathPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint

type NestedSettingsConfigPath<T> = {
  [K in keyof T & string]:
  T[K] extends SettingsPathPrimitive
    ? K
    : T[K] extends readonly unknown[]
      ? K
      : T[K] extends object
        ? string extends keyof T[K]
          ? K
          : K | `${K}.${NestedSettingsConfigPath<T[K]>}`
        : K
}[keyof T & string]

export type SettingsConfigPath =
  `settings.${NestedSettingsConfigPath<SettingsConfigState>}`

export type SettingsConfigSaveTarget =
  | SettingsConfigPath
  | Partial<SettingsConfigState>

type SaveSettingsConfigHandler = (
  path: SettingsConfigSaveTarget,
  value?: unknown
) => Promise<boolean>

export interface ProxyDraftState {
  proxy: string
  npmProxy: string
  npmRegistry: string
}

export interface LogDraftState {
  logLevel: string[]
  logFileSizeLimit: string
}

export interface SettingsNavItem {
  id: string
  kind: SettingsNavItemKind
  section?: SettingsSectionId
  routeTo?: "/main/settings/shortcuts"
  searchItemId?: string
}

export interface SettingsSearchItem {
  id: string
  section: SettingsSectionId
  title: string
  description: string
  keywords: string[]
}

export const settingsNavItems: SettingsNavItem[] = [
  { id: settingsSectionId.General, kind: settingsNavItemKind.Section, section: settingsSectionId.General },
  { id: settingsSectionId.Appearance, kind: settingsNavItemKind.Section, section: settingsSectionId.Appearance },
  {
    id: settingsSectionId.UploadWorkflow,
    kind: settingsNavItemKind.Section,
    section: settingsSectionId.UploadWorkflow,
  },
  { id: settingsSectionId.Network, kind: settingsNavItemKind.Section, section: settingsSectionId.Network },
  {
    id: "shortcuts-route",
    kind: settingsNavItemKind.Route,
    routeTo: "/main/settings/shortcuts",
    searchItemId: "shortcuts-entry",
  },
  { id: settingsSectionId.Advanced, kind: settingsNavItemKind.Section, section: settingsSectionId.Advanced },
  { id: settingsSectionId.About, kind: settingsNavItemKind.Section, section: settingsSectionId.About },
]

export const allSettingsSections: SettingsSectionId[] = [
  settingsSectionId.General,
  settingsSectionId.Appearance,
  settingsSectionId.UploadWorkflow,
  settingsSectionId.Network,
  settingsSectionId.Advanced,
  settingsSectionId.About,
]

export function isValidSettingsSection(value: unknown): value is SettingsSectionId {
  return (
    typeof value === "string" &&
    allSettingsSections.includes(value as SettingsSectionId)
  )
}

export function resolveSettingsSection(value: unknown): SettingsSectionId {
  return isValidSettingsSection(value)
    ? value
    : settingsSectionId.General
}

export const settingsSectionItemIds: Record<SettingsSectionId, string[]> = {
  [settingsSectionId.General]: [
    "language",
    "startup-mode",
    "auto-start",
  ],
  [settingsSectionId.Appearance]: [
    "appearance-mode",
    "show-dock-icon",
    "show-menubar-icon",
    "mini-window-on-top",
    "visible-providers",
  ],
  [settingsSectionId.UploadWorkflow]: [
    "rename-before-upload",
    "timestamp-rename",
    "auto-copy-url",
    "builtin-clipboard",
    "encode-output-url",
    "upload-notification",
    "notification-sound",
    "custom-link-format",
  ],
  [settingsSectionId.Network]: [
    "upload-proxy",
    "plugin-proxy",
    "plugin-mirror",
    "server",
  ],
  [settingsSectionId.Advanced]: [
    "log-level",
    "log-size",
    "open-config-file",
    "open-log-file",
    "url-rewrite-entry",
  ],
  [settingsSectionId.About]: [
    "about-version",
    "about-update",
    "about-link-website",
    "about-link-github",
    "about-link-docs",
    "about-link-privacy",
    "about-link-terms",
  ],
}

export function sectionHasMatchedItems(
  section: SettingsSectionId,
  matchedItemIds: Set<string>
) {
  const sectionItems = settingsSectionItemIds[section]
  return sectionItems.some((itemId) => matchedItemIds.has(itemId))
}

export function filterSettingsNavItemsBySearch(
  searchValue: string,
  matchedSections: SettingsSectionId[],
  matchedItemIds: Set<string>
) {
  const hasSearch = normalizeText(searchValue).length > 0

  if (!hasSearch) {
    return settingsNavItems
  }

  const matchedSectionSet = new Set(matchedSections)

  return settingsNavItems.filter((item) => {
    if (item.kind === settingsNavItemKind.Section) {
      if (!item.section || !matchedSectionSet.has(item.section)) {
        return false
      }

      return sectionHasMatchedItems(item.section, matchedItemIds)
    }

    return item.searchItemId ? matchedItemIds.has(item.searchItemId) : false
  })
}

export const settingLogLevel = {
  All: "all",
  Success: "success",
  Error: "error",
  Info: "info",
  Warn: "warn",
  None: "none",
} as const

export type SettingLogLevel =
  ValueOf<typeof settingLogLevel>

const defaultSettingsShortKeyMap: SettingsShortKeyMap = {
  "picgo:upload": {
    name: "upload",
    label: "Quick Upload",
    key: "CommandOrControl+Shift+U",
    enable: true,
  }
}

export const defaultSettingsConfig: SettingsConfigState = {
  appearance: settingsAppearance.Auto,
  pasteStyle: IPasteStyle.MARKDOWN,
  showUpdateTip: false,
  autoStart: false,
  rename: false,
  autoRename: false,
  uploadNotification: false,
  notificationSound: true,
  miniWindowOnTop: false,
  logLevel: [settingLogLevel.All],
  autoCopyUrl: true,
  checkBetaUpdate: true,
  useBuiltinClipboard: false,
  language: "en",
  logFileSizeLimit: 10,
  encodeOutputURL: false,
  showDockIcon: true,
  showMenubarIcon: true,
  customLink: "$url",
  npmProxy: "",
  npmRegistry: "",
  server: {
    port: 36677,
    host: "127.0.0.1",
    enable: true,
  },
  startupMode: IStartupMode.HIDE,
  shortKey: defaultSettingsShortKeyMap,
  urlRewrite: {
    rules: [],
  },
}

export const defaultSettingsVersion: SettingsVersionState = {
  currentVersion: "3.0.0",
  latestVersion: null,
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

const settingsSearchKeywordsByItemId: Record<string, string[]> = {
  language: [
    "语言",
    "語言",
    "语言设置",
    "語言設定",
    "简体中文",
    "繁体中文",
    "繁體中文",
    "英文",
    "英語",
  ],
  "startup-mode": [
    "启动",
    "啟動",
    "启动模式",
    "啟動模式",
    "开机",
    "開機",
    "主窗口",
    "迷你窗口",
    "静默",
    "靜默",
  ],
  "auto-start": [
    "开机自启",
    "開機自啟",
    "自启动",
    "自啟動",
    "自动启动",
    "自動啟動",
    "登录启动",
    "登入啟動",
  ],
  "show-dock-icon": ["程序坞", "程式塢", "dock", "图标", "圖標"],
  "show-menubar-icon": ["菜单栏", "選單列", "状态栏", "狀態列", "托盘", "系統匣"],
  "mini-window-on-top": ["置顶", "置頂", "始终置顶", "永遠置頂", "小窗置頂"],
  "appearance-mode": [
    "外观模式",
    "外觀模式",
    "主题",
    "主題",
    "浅色",
    "淺色",
    "深色",
    "自动",
    "自動",
    "跟随系统",
    "跟隨系統",
  ],
  "visible-providers": ["图床", "圖床", "显示图床", "顯示圖床", "可见图床", "可見圖床"],
  "rename-before-upload": ["重命名", "重新命名", "上传前重命名", "上傳前重命名", "檔名"],
  "timestamp-rename": ["时间戳", "時間戳", "自动重命名", "自動重命名"],
  "auto-copy-url": ["自动复制", "自動複製", "复制链接", "複製連結", "上传后复制", "上傳後複製"],
  "builtin-clipboard": ["内置剪贴板", "內建剪貼簿", "剪贴板", "剪貼簿"],
  "encode-output-url": ["编码", "編碼", "url 编码", "url 編碼", "链接编码", "連結編碼"],
  "upload-notification": ["通知", "上传通知", "上傳通知", "提醒"],
  "notification-sound": ["提示音", "通知声音", "通知音效", "音效"],
  "custom-link-format": ["自定义链接", "自訂連結", "链接格式", "連結格式", "模板", "樣板"],
  "upload-proxy": ["代理", "镜像", "鏡像", "上传代理", "上傳代理", "代理和镜像", "代理與鏡像"],
  "plugin-proxy": ["插件代理", "外掛代理", "插件安装代理", "外掛安裝代理"],
  "plugin-mirror": ["插件镜像", "外掛鏡像", "插件安装镜像", "外掛安裝鏡像", "镜像源", "鏡像源"],
  server: ["服务", "服務", "服务端", "服務端", "端口", "埠", "主机", "主機"],
  "log-level": ["日志级别", "日誌級別", "日志等级", "日誌等級"],
  "log-size": ["日志大小", "日誌大小", "日志文件大小", "日誌檔案大小"],
  "open-config-file": ["配置文件", "設定檔", "配置檔", "打开配置", "開啟設定檔"],
  "open-log-file": ["日志文件", "日誌檔案", "打开日志", "開啟日誌"],
  "url-rewrite-entry": ["链接重写", "連結重寫", "url 重写", "網址重寫", "重写规则", "重寫規則"],
  "shortcuts-entry": ["快捷键", "快捷鍵", "热键", "熱鍵", "键盘", "鍵盤"],
  "about-version": ["关于", "關於", "版本", "当前版本", "目前版本"],
  "about-update": ["检查更新", "檢查更新", "更新", "测试版", "測試版"],
  "about-link-website": ["官网", "官網", "官方网站", "官方網站", "网站", "網站"],
  "about-link-github": ["代码仓库", "程式碼倉庫", "源码", "原始碼", "github"],
  "about-link-docs": ["文档", "文件", "使用文档", "使用文件", "教程", "教學"],
  "about-link-privacy": ["隐私", "隱私", "隐私政策", "隱私政策"],
  "about-link-terms": ["服务条款", "服務條款", "条款", "條款"],
}

const settingsSectionSearchKeywords: Record<SettingsSectionId, string[]> = {
  [settingsSectionId.General]: ["general", "通用", "一般"],
  [settingsSectionId.Appearance]: ["appearance", "外观", "外觀"],
  [settingsSectionId.UploadWorkflow]: ["upload workflow", "上传流程", "上傳流程", "上传", "上傳"],
  [settingsSectionId.Network]: ["network", "网络", "網路"],
  [settingsSectionId.Advanced]: ["advanced", "高级", "高級", "進階"],
  [settingsSectionId.About]: ["about", "关于", "關於"],
}

function mergeSettingsSearchKeywords(
  itemId: string,
  baseKeywords: string[]
) {
  return [
    ...baseKeywords,
    ...(settingsSearchKeywordsByItemId[itemId] ?? []),
  ]
}

export function buildSettingsSearchItems(
  config: SettingsConfigState,
  providers: ProviderUploaderSummary[],
  picBedProxy: string
): SettingsSearchItem[] {
  const providerKeywords = providers.map((provider) => provider.name)

  return [
    {
      id: "language",
      section: settingsSectionId.General,
      title: "Language",
      description: "Choose interface language",
      keywords: mergeSettingsSearchKeywords("language", [config.language, "locale"]),
    },
    {
      id: "startup-mode",
      section: settingsSectionId.General,
      title: "Startup Mode",
      description: "Select window mode at launch",
      keywords: mergeSettingsSearchKeywords("startup-mode", [config.startupMode]),
    },
    {
      id: "auto-start",
      section: settingsSectionId.General,
      title: "Launch On Boot",
      description: "Open at OS login",
      keywords: mergeSettingsSearchKeywords("auto-start", ["autostart"]),
    },
    {
      id: "appearance-mode",
      section: settingsSectionId.Appearance,
      title: "Appearance",
      description: "Select light, dark or follow system",
      keywords: mergeSettingsSearchKeywords("appearance-mode", [config.appearance, "theme"]),
    },
    {
      id: "show-dock-icon",
      section: settingsSectionId.Appearance,
      title: "Show Dock Icon",
      description: "macOS dock icon visibility",
      keywords: mergeSettingsSearchKeywords("show-dock-icon", ["dock", "mac"]),
    },
    {
      id: "show-menubar-icon",
      section: settingsSectionId.Appearance,
      title: "Show Menubar Icon",
      description: "macOS menu bar icon visibility",
      keywords: mergeSettingsSearchKeywords("show-menubar-icon", ["menu", "tray", "mac"]),
    },
    {
      id: "mini-window-on-top",
      section: settingsSectionId.Appearance,
      title: "Mini Window On Top",
      description: "Pin mini window always on top",
      keywords: mergeSettingsSearchKeywords("mini-window-on-top", ["pin", "always on top"]),
    },
    {
      id: "visible-providers",
      section: settingsSectionId.Appearance,
      title: "Visible Providers",
      description: "Select providers shown in app",
      keywords: mergeSettingsSearchKeywords("visible-providers", providerKeywords),
    },
    {
      id: "rename-before-upload",
      section: settingsSectionId.UploadWorkflow,
      title: "Rename Before Upload",
      description: "Enable rename before upload",
      keywords: mergeSettingsSearchKeywords("rename-before-upload", ["rename"]),
    },
    {
      id: "timestamp-rename",
      section: settingsSectionId.UploadWorkflow,
      title: "Timestamp Rename",
      description: "Use timestamp naming",
      keywords: mergeSettingsSearchKeywords("timestamp-rename", ["auto rename", "timestamp"]),
    },
    {
      id: "auto-copy-url",
      section: settingsSectionId.UploadWorkflow,
      title: "Auto Copy URL",
      description: "Copy uploaded URL automatically",
      keywords: mergeSettingsSearchKeywords("auto-copy-url", ["clipboard", "copy"]),
    },
    {
      id: "builtin-clipboard",
      section: settingsSectionId.UploadWorkflow,
      title: "Use Builtin Clipboard",
      description: "Use internal clipboard upload",
      keywords: mergeSettingsSearchKeywords("builtin-clipboard", ["clipboard"]),
    },
    {
      id: "encode-output-url",
      section: settingsSectionId.UploadWorkflow,
      title: "Encode Output URL",
      description: "Encode output/copy URL",
      keywords: mergeSettingsSearchKeywords("encode-output-url", ["encode"]),
    },
    {
      id: "upload-notification",
      section: settingsSectionId.UploadWorkflow,
      title: "Upload Notification",
      description: "Show upload result notification",
      keywords: mergeSettingsSearchKeywords("upload-notification", ["notification"]),
    },
    {
      id: "notification-sound",
      section: settingsSectionId.UploadWorkflow,
      title: "Notification Sound",
      description: "Play sound on upload result",
      keywords: mergeSettingsSearchKeywords("notification-sound", ["sound"]),
    },
    {
      id: "custom-link-format",
      section: settingsSectionId.UploadWorkflow,
      title: "Custom Link Format",
      description: "Set custom link template",
      keywords: mergeSettingsSearchKeywords("custom-link-format", [
        config.customLink,
        "$url",
        "$fileName",
        "$extName",
      ]),
    },
    {
      id: "upload-proxy",
      section: settingsSectionId.Network,
      title: "Set Proxy and Mirror",
      description: "Configure proxy and mirror",
      keywords: mergeSettingsSearchKeywords("upload-proxy", [picBedProxy, "proxy"]),
    },
    {
      id: "plugin-proxy",
      section: settingsSectionId.Network,
      title: "Plugin Install Proxy",
      description: "Configure plugin proxy",
      keywords: mergeSettingsSearchKeywords("plugin-proxy", [config.npmProxy]),
    },
    {
      id: "plugin-mirror",
      section: settingsSectionId.Network,
      title: "Plugin Install Mirror",
      description: "Configure plugin mirror",
      keywords: mergeSettingsSearchKeywords("plugin-mirror", [config.npmRegistry]),
    },
    {
      id: "server",
      section: settingsSectionId.Network,
      title: "Server Settings",
      description: "Configure PicGo server",
      keywords: mergeSettingsSearchKeywords("server", [
        config.server.host,
        String(config.server.port),
      ]),
    },
    {
      id: "log-level",
      section: settingsSectionId.Advanced,
      title: "Log Level",
      description: "Configure runtime log verbosity",
      keywords: mergeSettingsSearchKeywords("log-level", config.logLevel),
    },
    {
      id: "log-size",
      section: settingsSectionId.Advanced,
      title: "Log File Size",
      description: "Configure max log file size",
      keywords: mergeSettingsSearchKeywords("log-size", [String(config.logFileSizeLimit), "mb"]),
    },
    {
      id: "open-config-file",
      section: settingsSectionId.Advanced,
      title: "Open Config File",
      description: "Open PicGo config file",
      keywords: mergeSettingsSearchKeywords("open-config-file", ["config", "file"]),
    },
    {
      id: "open-log-file",
      section: settingsSectionId.Advanced,
      title: "Open Log File",
      description: "Open PicGo log file",
      keywords: mergeSettingsSearchKeywords("open-log-file", ["log", "file"]),
    },
    {
      id: "url-rewrite-entry",
      section: settingsSectionId.Advanced,
      title: "URL Rewrite",
      description: "Manage rewrite rules",
      keywords: mergeSettingsSearchKeywords("url-rewrite-entry", ["rewrite", "regex"]),
    },
    {
      id: "shortcuts-entry",
      section: settingsSectionId.Advanced,
      title: "Shortcuts",
      description: "Configure shortcut keys",
      keywords: mergeSettingsSearchKeywords("shortcuts-entry", [
        "hotkey",
        "shortcut",
        "keyboard",
      ]),
    },
    {
      id: "about-version",
      section: settingsSectionId.About,
      title: "Version",
      description: "Current app version",
      keywords: mergeSettingsSearchKeywords("about-version", ["about", "version"]),
    },
    {
      id: "about-update",
      section: settingsSectionId.About,
      title: "Check Update",
      description: "Check latest version",
      keywords: mergeSettingsSearchKeywords("about-update", ["update", "beta"]),
    },
    {
      id: "about-link-website",
      section: settingsSectionId.About,
      title: "Website",
      description: "Open official website",
      keywords: mergeSettingsSearchKeywords("about-link-website", ["official", "picgo.app"]),
    },
    {
      id: "about-link-github",
      section: settingsSectionId.About,
      title: "GitHub",
      description: "Open GitHub repository",
      keywords: mergeSettingsSearchKeywords("about-link-github", ["repository", "source code"]),
    },
    {
      id: "about-link-docs",
      section: settingsSectionId.About,
      title: "Documentation",
      description: "Open PicGo documentation",
      keywords: mergeSettingsSearchKeywords("about-link-docs", ["guide", "manual"]),
    },
    {
      id: "about-link-privacy",
      section: settingsSectionId.About,
      title: "Privacy Policy",
      description: "Open privacy policy",
      keywords: mergeSettingsSearchKeywords("about-link-privacy", ["privacy", "policy"]),
    },
    {
      id: "about-link-terms",
      section: settingsSectionId.About,
      title: "Terms of Service",
      description: "Open terms of service",
      keywords: mergeSettingsSearchKeywords("about-link-terms", ["terms", "service"]),
    },
  ]
}

export function filterSettingsSectionsBySearch(
  allSections: SettingsSectionId[],
  searchItems: SettingsSearchItem[],
  searchValue: string
) {
  const normalizedQuery = normalizeText(searchValue)

  if (!normalizedQuery) {
    return {
      matchedSections: allSections,
      matchedItemIds: new Set<string>(),
      hasQuery: false,
    }
  }

  const matchedItems = searchItems.filter((item) => {
    const haystack = [
      item.title,
      item.description,
      ...item.keywords,
      ...(settingsSectionSearchKeywords[item.section] ?? []),
      item.section,
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })

  const matchedSections = allSections.filter((section) =>
    matchedItems.some((item) => item.section === section)
  )

  return {
    matchedSections,
    matchedItemIds: new Set(matchedItems.map((item) => item.id)),
    hasQuery: true,
  }
}

export function normalizeLogLevels(nextLevels: string[]) {
  if (nextLevels.length === 0) {
    return [settingLogLevel.All]
  }

  if (nextLevels.includes(settingLogLevel.All)) {
    return [settingLogLevel.All]
  }

  if (nextLevels.includes(settingLogLevel.None)) {
    return [settingLogLevel.None]
  }

  return nextLevels
}

export function toggleLogLevelDraft(
  currentLevels: string[],
  level: SettingLogLevel,
  checked: boolean
) {
  if (!checked) {
    return currentLevels.filter((item) => item !== level)
  }

  if (level === settingLogLevel.All || level === settingLogLevel.None) {
    return [level]
  }

  const nextLevels = currentLevels.filter(
    (item) => item !== settingLogLevel.All && item !== settingLogLevel.None
  )

  if (nextLevels.includes(level)) {
    return nextLevels
  }

  return [...nextLevels, level]
}

export function isLogLevelOptionDisabled(
  currentLevels: string[],
  level: SettingLogLevel
) {
  const hasAll = currentLevels.includes(settingLogLevel.All)
  const hasNone = currentLevels.includes(settingLogLevel.None)
  const hasExclusive = hasAll || hasNone

  if (hasExclusive) {
    return !currentLevels.includes(level)
  }

  const hasSpecificLevels = currentLevels.some(
    (item) => item !== settingLogLevel.All && item !== settingLogLevel.None
  )

  if (!hasSpecificLevels) {
    return false
  }

  return level === settingLogLevel.All || level === settingLogLevel.None
}

export function sanitizeNumericInput(value: string) {
  return value.replace(/\D+/g, "")
}

export function buildSettingsShortcutItems(
  shortKeyMap: SettingsShortKeyMap
) {
  return Object.entries(shortKeyMap).map(([id, shortcut]) => {
    const [from = "picgo", ...nameSegments] = id.split(":")
    const fallbackName = nameSegments.join(":") || id

    return {
      id,
      name: shortcut.name || fallbackName,
      label: shortcut.label || fallbackName,
      key: shortcut.key,
      enable: shortcut.enable,
      from,
    } satisfies SettingsShortcutItem
  })
}

function buildUrlRewriteDraftRuleId(
  rule: SettingsUrlRewriteRule,
  index: number
) {
  return `${index}:${rule.match}:${rule.replace}:${rule.enable ? "1" : "0"}`
}

export function buildSettingsUrlRewriteDraftRules(
  rules: SettingsUrlRewriteRule[]
) {
  return rules.map((rule, index) => ({
    ...rule,
    id: buildUrlRewriteDraftRuleId(rule, index),
  })) satisfies SettingsUrlRewriteDraftRule[]
}

export function stripSettingsUrlRewriteDraftRules(
  rules: SettingsUrlRewriteDraftRule[]
) {
  return rules.map(({ id: _id, ...rule }) => rule) satisfies SettingsUrlRewriteRule[]
}

export function buildLogSettingsPatch(draft: LogDraftState) {
  const sizeLimit = Number(sanitizeNumericInput(draft.logFileSizeLimit))

  return {
    logLevel: normalizeLogLevels(draft.logLevel),
    logFileSizeLimit:
      Number.isFinite(sizeLimit) && sizeLimit > 0 ? sizeLimit : 10,
  } satisfies Partial<SettingsConfigState>
}

export async function saveLogSettingsConfig(
  onSaveConfig: SaveSettingsConfigHandler,
  draft: LogDraftState
) {
  return onSaveConfig(buildLogSettingsPatch(draft))
}

export function parseShortcutKeys(value: string) {
  return value
    .split("+")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
}

export function buildShortcutValue(keys: string[]) {
  return keys.join("+")
}

export function applyUrlRewriteRules(
  inputUrl: string,
  rules: SettingsUrlRewriteRule[]
) {
  for (const rule of rules) {
    if (!rule.enable) {
      continue
    }

    try {
      const flags = `${rule.global ? "g" : ""}${rule.ignoreCase ? "i" : ""}`
      const regex = new RegExp(rule.match, flags)
      if (!regex.test(inputUrl)) {
        continue
      }

      const scopedRegex = new RegExp(rule.match, flags)
      return inputUrl.replace(scopedRegex, rule.replace)
    } catch {
      return null
    }
  }

  return inputUrl
}
