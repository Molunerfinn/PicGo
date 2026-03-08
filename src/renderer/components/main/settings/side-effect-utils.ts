import { openFile, openUrl } from "@/lib/utils"
import { settingsMockApi } from "./settings-mock"

export async function openSettingsConfigFile() {
  const result = await settingsMockApi.openConfigFile()
  await openFile(result.path)
  return result.path
}

export async function openSettingsLogFile() {
  const result = await settingsMockApi.openLogFile()
  await openFile(result.path)
  return result.path
}

export async function openSettingsExternalUrl(url: string) {
  await settingsMockApi.openExternalUrl(url)
  await openUrl(url)
}
