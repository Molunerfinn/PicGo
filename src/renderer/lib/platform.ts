import type { ValueOf } from "@/types/utils"

export const AppPlatformValues = {
  MacOS: "darwin",
  Windows: "win32",
  Linux: "linux",
} as const
export const appPlatform = AppPlatformValues

export type AppPlatform =
  ValueOf<typeof AppPlatformValues>

let overridePlatform: AppPlatform | null = null

function resolveFromNavigator() {
  if (typeof navigator === "undefined") {
    return AppPlatformValues.MacOS
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
    return AppPlatformValues.MacOS
  }

  if (normalized.includes("win")) {
    return AppPlatformValues.Windows
  }

  return AppPlatformValues.Linux
}

export function getAppPlatform(): AppPlatform {
  return overridePlatform ?? resolveFromNavigator()
}

export function isMacOS() {
  return getAppPlatform() === AppPlatformValues.MacOS
}

export function isWindows() {
  return getAppPlatform() === AppPlatformValues.Windows
}

export function isLinux() {
  return getAppPlatform() === AppPlatformValues.Linux
}

export function setAppPlatformForTesting(nextPlatform: AppPlatform | null) {
  overridePlatform = nextPlatform
}
