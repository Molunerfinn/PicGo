import {
  buildShortcutValue,
  defaultSettingsConfig,
  defaultSettingsVersion,
  type SettingsConfigState,
  type SettingsShortcutItem,
  type SettingsUrlRewriteRule,
  type SettingsVersionState,
} from "./utils"

type SettingsPatch = Partial<SettingsConfigState>

interface CheckUpdateResult {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
}

let configState: SettingsConfigState = structuredClone(defaultSettingsConfig)
let versionState: SettingsVersionState = structuredClone(defaultSettingsVersion)

const mockLatency = {
  Base: 220,
  Jitter: 120,
} as const

const mockReleaseVersions = {
  stable: ["3.0.4", "3.0.3", "3.0.2"],
  beta: ["3.1.0-beta.1", "3.1.0-beta.0"],
} as const

interface ParsedSemver {
  major: number
  minor: number
  patch: number
  preRelease: string[]
}

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

function parseSemver(version: string): ParsedSemver | null {
  const matched = version.trim().replace(/^v/, "").match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/
  )

  if (!matched) {
    return null
  }

  const major = Number(matched[1])
  const minor = Number(matched[2])
  const patch = Number(matched[3])
  const preRelease = matched[4] ? matched[4].split(".") : []

  return {
    major,
    minor,
    patch,
    preRelease,
  }
}

function comparePreRelease(left: string[], right: string[]) {
  if (left.length === 0 && right.length === 0) {
    return 0
  }
  if (left.length === 0) {
    return 1
  }
  if (right.length === 0) {
    return -1
  }

  const comparedLength = Math.max(left.length, right.length)
  for (let index = 0; index < comparedLength; index += 1) {
    const leftToken = left[index]
    const rightToken = right[index]

    if (leftToken === undefined) {
      return -1
    }
    if (rightToken === undefined) {
      return 1
    }

    const leftNumber = Number(leftToken)
    const rightNumber = Number(rightToken)
    const leftIsNumber = String(leftNumber) === leftToken
    const rightIsNumber = String(rightNumber) === rightToken

    if (leftIsNumber && rightIsNumber) {
      if (leftNumber !== rightNumber) {
        return leftNumber < rightNumber ? -1 : 1
      }
      continue
    }

    if (leftIsNumber && !rightIsNumber) {
      return -1
    }
    if (!leftIsNumber && rightIsNumber) {
      return 1
    }

    if (leftToken !== rightToken) {
      return leftToken < rightToken ? -1 : 1
    }
  }

  return 0
}

function isVersionLower(current: string, latest: string) {
  const parsedCurrent = parseSemver(current)
  const parsedLatest = parseSemver(latest)

  if (!parsedCurrent || !parsedLatest) {
    return false
  }

  if (parsedCurrent.major !== parsedLatest.major) {
    return parsedCurrent.major < parsedLatest.major
  }
  if (parsedCurrent.minor !== parsedLatest.minor) {
    return parsedCurrent.minor < parsedLatest.minor
  }
  if (parsedCurrent.patch !== parsedLatest.patch) {
    return parsedCurrent.patch < parsedLatest.patch
  }

  return comparePreRelease(parsedCurrent.preRelease, parsedLatest.preRelease) < 0
}

function compareVersionToUpdate(
  current: string,
  latest: string,
  checkBetaUpdate: boolean
) {
  if (latest.includes("beta") && !checkBetaUpdate) {
    return false
  }

  return isVersionLower(current, latest)
}

function getLatestVersion(checkBetaUpdate: boolean) {
  if (checkBetaUpdate) {
    return mockReleaseVersions.beta[0] ?? mockReleaseVersions.stable[0] ?? ""
  }

  return mockReleaseVersions.stable[0] ?? ""
}

export const settingsMockApi = {
  async getSettingsConfig() {
    await waitForMock()
    return cloneValue(configState)
  },

  async saveConfig(patch: SettingsPatch) {
    await waitForMock()
    // TODO: replace this in-memory merge with Electron IPC `saveConfig` request.
    configState = {
      ...configState,
      ...cloneValue(patch),
    }

    return cloneValue(configState)
  },

  async saveShortcut(shortcutId: string, keys: string[]) {
    await waitForMock()
    // TODO: replace this in-memory write with Electron IPC shortcut persistence.
    configState = {
      ...configState,
      shortcuts: configState.shortcuts.map((shortcut) => {
        return shortcut.id === shortcutId
          ? {
            ...shortcut,
            key: buildShortcutValue(cloneValue(keys)),
          }
          : shortcut
      }),
    }

    return cloneValue(configState.shortcuts)
  },

  async setShortcutEnabled(shortcutId: string, enable: boolean) {
    await waitForMock()
    // TODO: replace this in-memory write with Electron IPC shortcut enable/disable persistence.
    configState = {
      ...configState,
      shortcuts: configState.shortcuts.map((shortcut) => {
        return shortcut.id === shortcutId
          ? {
            ...shortcut,
            enable,
          }
          : shortcut
      }),
    }

    return cloneValue(configState.shortcuts)
  },

  async saveUrlRewriteRules(rules: SettingsUrlRewriteRule[]) {
    await waitForMock()
    // TODO: replace this in-memory write with Electron IPC urlRewrite persistence.
    configState = {
      ...configState,
      urlRewriteRules: cloneValue(rules),
    }
    return cloneValue(configState.urlRewriteRules)
  },

  async checkForUpdates(checkBetaUpdate: boolean): Promise<CheckUpdateResult> {
    await waitForMock()
    // TODO: replace mock latest-version strategy with Electron updateChecker/getLatestVersion IPC.
    const latestVersion = getLatestVersion(checkBetaUpdate)
    const hasUpdate = compareVersionToUpdate(
      versionState.currentVersion,
      latestVersion,
      checkBetaUpdate
    )

    versionState = {
      ...versionState,
      latestVersion,
    }

    return {
      currentVersion: versionState.currentVersion,
      latestVersion,
      hasUpdate,
    }
  },

  async openConfigFile() {
    await waitForMock()
    // TODO: replace with Electron IPC open config file command.
    return {
      path: "~/.picgo/data.json",
    }
  },

  async openLogFile() {
    await waitForMock()
    // TODO: replace with Electron IPC open log file command.
    return {
      path: "~/.picgo/picgo.log",
    }
  },

  async openExternalUrl(url: string) {
    await waitForMock()
    // TODO: replace with Electron IPC open external URL command.
    return {
      url,
    }
  },

  async resetMockState() {
    await waitForMock()
    configState = cloneValue(defaultSettingsConfig)
    versionState = cloneValue(defaultSettingsVersion)
  },
}

export type { CheckUpdateResult, SettingsPatch, SettingsConfigState, SettingsShortcutItem }
