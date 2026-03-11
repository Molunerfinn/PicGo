import { settingsAdapter } from "@/adapters/settings"

export async function openSettingsConfigFile() {
  settingsAdapter.openConfigFile()
  return "data.json"
}

export async function openSettingsLogFile() {
  settingsAdapter.openLogFile()
  return "picgo.log"
}

export async function openSettingsExternalUrl(url: string) {
  settingsAdapter.openExternalUrl(url)
}
