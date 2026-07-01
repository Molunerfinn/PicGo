import { compare } from 'compare-versions'
import { appConfigAdapter } from '@/adapters/app-config'
import { setCurrentLanguage } from '@/i18n'
import { settingsAdapter } from '@/adapters/settings'
import type {
  SettingsConfigSaveTarget,
  SettingsConfigState,
  SettingsUrlRewriteRule
} from '@/components/main/settings/utils'
import { defaultSettingsConfig } from '@/components/main/settings/utils'
import { appActions } from '@/store/app-actions'
import {
  applySettingsPatch,
  buildPersistedSettingsPatch,
  mergeSettingsConfigPatch
} from '@/store/utils'
import { useAppStore } from '@/store/app-store'
import { useSettingsStore } from './store'

function updateSettingsState (patch: Partial<SettingsConfigState>) {
  useAppStore.setState((state) => {
    if (!state.appConfig) {
      return
    }

    state.appConfig.settings = mergeSettingsConfigPatch(
      state.appConfig.settings,
      patch
    )
  })
}

export const settingsStoreActions = {
  setSearchValue (value: string) {
    useSettingsStore.setState((state) => {
      state.searchValue = value
    })
  },
  async saveLanguage (language: string) {
    await settingsStoreActions.saveSettingsConfig('settings.language', language)
    await setCurrentLanguage(language)
  },
  async saveSettingsConfig (
    path: SettingsConfigSaveTarget,
    value?: unknown
  ) {
    await appActions.ensureSettingsHydrated()
    const patch = applySettingsPatch(path, value)
    const persistedPatch = buildPersistedSettingsPatch(patch)

    if (Object.keys(persistedPatch).length > 0) {
      await settingsAdapter.savePatch(persistedPatch)
    }

    if (typeof patch.autoStart === 'boolean') {
      settingsAdapter.setAutoStart(patch.autoStart)
    }

    if (typeof patch.showDockIcon === 'boolean') {
      settingsAdapter.showDockIcon(patch.showDockIcon)
    }

    if (typeof patch.showMenubarIcon === 'boolean') {
      settingsAdapter.showMenubarIcon(patch.showMenubarIcon)
    }

    if (patch.server) {
      settingsAdapter.updateServer()
    }

    if (typeof patch.customLink === 'string') {
      settingsAdapter.updateCustomLink()
    }

    updateSettingsState(patch)
  },
  async saveVisiblePicBedNames (visibleNames: string[]) {
    await appActions.ensureSettingsHydrated()
    const nextPicBedList = await settingsAdapter.updateVisiblePicBeds(visibleNames)

    useAppStore.setState((state) => {
      if (!state.appConfig) {
        return
      }

      state.appConfig.picBed.list = nextPicBedList
    })
  },
  async savePicBedProxy (proxy: string) {
    await appActions.ensureSettingsHydrated()
    await appConfigAdapter.saveConfig({
      'picBed.proxy': proxy
    })

    useAppStore.setState((state) => {
      if (!state.appConfig) {
        return
      }

      state.appConfig.picBed.proxy = proxy
    })
  },
  async updateShortcutKeys (shortcutId: string, keys: string[]) {
    await appActions.ensureSettingsHydrated()
    const currentShortKey =
      useAppStore.getState().appConfig?.settings.shortKey ??
      defaultSettingsConfig.shortKey
    const targetShortcut = currentShortKey[shortcutId]

    if (!targetShortcut) {
      throw new Error(`Shortcut not found: ${shortcutId}`)
    }

    const nextKey = keys.join('+')
    const [from = 'picgo'] = shortcutId.split(':')
    const didUpdate = await settingsAdapter.updateShortcut({
      enable: targetShortcut.enable,
      key: nextKey,
      label: targetShortcut.label,
      name: targetShortcut.name,
      from
    }, targetShortcut.key)

    if (!didUpdate) {
      throw new Error(`Failed to update shortcut: ${shortcutId}`)
    }

    updateSettingsState({
      shortKey: {
        ...currentShortKey,
        [shortcutId]: {
          ...targetShortcut,
          key: nextKey
        }
      }
    })
  },
  async setShortcutEnabled (shortcutId: string, enable: boolean) {
    await appActions.ensureSettingsHydrated()
    const currentShortKey =
      useAppStore.getState().appConfig?.settings.shortKey ??
      defaultSettingsConfig.shortKey
    const targetShortcut = currentShortKey[shortcutId]

    if (!targetShortcut) {
      throw new Error(`Shortcut not found: ${shortcutId}`)
    }

    const [from = 'picgo'] = shortcutId.split(':')
    settingsAdapter.toggleShortcutEnabled({
      enable,
      key: targetShortcut.key,
      label: targetShortcut.label,
      name: targetShortcut.name,
      from
    })

    updateSettingsState({
      shortKey: {
        ...currentShortKey,
        [shortcutId]: {
          ...targetShortcut,
          enable
        }
      }
    })
  },
  async saveUrlRewriteRules (rules: SettingsUrlRewriteRule[]) {
    await appActions.ensureSettingsHydrated()
    await settingsAdapter.saveUrlRewriteRules(rules)

    updateSettingsState({
      urlRewrite: {
        rules
      }
    })
  },
  async checkUpdates () {
    await appActions.ensureSettingsHydrated()

    const currentVersion = useAppStore.getState().settingsVersion.currentVersion
    const includeBeta =
      useAppStore.getState().appConfig?.settings.checkBetaUpdate ??
      defaultSettingsConfig.checkBetaUpdate
    const latestVersion = await settingsAdapter.checkLatestVersion(includeBeta)
    const hasUpdate = compare(currentVersion, latestVersion, '<')

    useAppStore.setState((state) => {
      state.settingsVersion.latestVersion = latestVersion
    })

    return {
      currentVersion,
      latestVersion,
      hasUpdate
    }
  }
}
