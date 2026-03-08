import type { ValueOf } from "@/types/utils"

export const appPlatform = {
  MacOS: "darwin",
  Windows: "win32",
  Linux: "linux",
} as const

export type AppPlatform =
  ValueOf<typeof appPlatform>

let overridePlatform: AppPlatform | null = null

function resolveFromNavigator() {
  if (typeof navigator === "undefined") {
    return appPlatform.MacOS
  }

  const navWithUserAgentData = navigator as Navigator & {
    userAgentData?: {
      platform?: string
    }
  }

  const platform =
    navWithUserAgentData.userAgentData?.platform ?? navigator.platform ?? ""
  const normalized = platform.toLowerCase()

  if (normalized.includes("mac")) {
    return appPlatform.MacOS
  }

  if (normalized.includes("win")) {
    return appPlatform.Windows
  }

  return appPlatform.Linux
}

export function getAppPlatform(): AppPlatform {
  return overridePlatform ?? resolveFromNavigator()
}

export function isMacOS() {
  return getAppPlatform() === appPlatform.MacOS
}

export function isWindows() {
  return getAppPlatform() === appPlatform.Windows
}

export function isLinux() {
  return getAppPlatform() === appPlatform.Linux
}

export function setAppPlatformForTesting(nextPlatform: AppPlatform | null) {
  overridePlatform = nextPlatform
}
