// @vitest-environment jsdom

import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { evaluatePluginConfig } from 'picgo'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@/adapters/plugins', () => ({
  pluginsAdapter: {
    refreshConfigSchema: vi.fn(async () => []),
    savePluginConfig: vi.fn(async () => {}),
    getInstalledPlugins: vi.fn(async () => [])
  }
}))

vi.mock('@/store/app-actions', () => ({
  appActions: {
    refreshAppConfig: vi.fn(async () => {}),
    hydrateAppState: vi.fn(async () => {})
  }
}))

import { PluginDetailPanel } from '@/components/main/plugins/plugin-detail-panel'
import { useAppStore } from '@/store/app-store'
import { usePluginStore } from '@/store/plugins/store'
import { pluginStoreActions } from '@/store/plugins/actions'
import { pluginsAdapter } from '@/adapters/plugins'
import { appActions } from '@/store/app-actions'
import { normalizePluginConfigSchema } from '@/components/common/normalize-plugin-schema'
import { pluginDetailTab, type PluginInstalledItem } from '@/components/main/plugins/types'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'

// Raw plugin config schema mirroring the picgo-plugin-test test plugin.
// mode → verbosity (default debug/info), apiVersion (default v2/v1).
const buildRawPluginSchema = (): unknown[] => [
  {
    name: 'mode',
    type: 'list',
    required: true,
    alias: 'Mode',
    default: 'basic',
    choices: ['basic', 'advanced']
  },
  {
    name: 'verbosity',
    type: 'list',
    required: false,
    alias: 'Verbosity',
    dependsOn: ['mode'],
    default: (answers: Record<string, unknown>) =>
      (answers.mode === 'advanced' ? 'debug' : 'info'),
    choices: (answers: Record<string, unknown>) =>
      (answers.mode === 'advanced'
        ? ['silent', 'info', 'debug', 'trace']
        : ['silent', 'info'])
  },
  {
    name: 'apiVersion',
    type: 'list',
    required: false,
    alias: 'API version',
    dependsOn: ['mode'],
    default: (answers: Record<string, unknown>) =>
      (answers.mode === 'advanced' ? 'v2' : 'v1'),
    choices: (answers: Record<string, unknown>) =>
      (answers.mode === 'advanced' ? ['v2', 'v2-beta'] : ['v1', 'v1-legacy'])
  }
]

const baseAppConfig = {
  picBed: {
    uploader: 'smms',
    current: 'smms',
    transformer: 'path',
    proxy: '',
    list: []
  },
  uploader: {} as Record<string, unknown>,
  settings: {
    appearance: 'auto',
    pasteStyle: IPasteStyle.MARKDOWN,
    showUpdateTip: false,
    autoStart: false,
    rename: false,
    autoRename: false,
    uploadNotification: false,
    notificationSound: true,
    miniWindowOnTop: false,
    logLevel: ['all'],
    autoCopyUrl: true,
    checkBetaUpdate: true,
    useBuiltinClipboard: false,
    language: 'en',
    logFileSizeLimit: 10,
    encodeOutputURL: false,
    showDockIcon: true,
    showMenubarIcon: true,
    customLink: '$url',
    npmProxy: '',
    npmRegistry: '',
    server: { port: 36677, host: '127.0.0.1', enable: true },
    startupMode: IStartupMode.HIDE,
    shortKey: {},
    urlRewrite: { rules: [] }
  },
  picgoPlugins: {},
  plugins: {} as Record<string, Record<string, unknown>>,
  transformer: {},
  needReload: false
}

const FULL_NAME = 'picgo-plugin-test'

function buildInstalledPlugin(): PluginInstalledItem {
  const schemaEvaluated = evaluatePluginConfig(
    buildRawPluginSchema() as Parameters<typeof evaluatePluginConfig>[0]
  ) as unknown[]
  return {
    name: 'test',
    fullName: FULL_NAME,
    author: 'tester',
    description: 'for test',
    logo: '',
    version: '1.0.0',
    gui: false,
    homepage: '',
    enabled: true,
    hasInstall: true,
    guiMenu: [],
    config: {
      plugin: {
        name: 'test',
        fullName: FULL_NAME,
        config: normalizePluginConfigSchema(schemaEvaluated)
      },
      transformer: { name: '', fullName: undefined, config: [] }
    },
    uploader: undefined
  }
}

function setupStore(pluginConfigInAppConfig: Record<string, unknown> | undefined) {
  const installedPlugin = buildInstalledPlugin()
  useAppStore.setState({
    defaultPicBed: 'smms',
    appConfig: {
      ...baseAppConfig,
      plugins: pluginConfigInAppConfig
        ? { [FULL_NAME]: pluginConfigInAppConfig }
        : {}
    } as never,
    picBeds: [],
    providers: [],
    providerSchemas: {},
    pluginsInstalled: [installedPlugin],
    settingsVersion: { currentVersion: '2.5.3', latestVersion: null },
    hasHydrated: true,
    hasSettingsHydrated: true,
    picgoCloud: {
      loginStatus: 'IDLE',
      loginError: null,
      hasAgreedToTermsAndPrivacy: false
    }
  } as never)
  usePluginStore.setState({
    searchValue: '',
    exactMatch: false,
    rawSearchResults: [],
    searchResults: [],
    isSearching: false,
    isImportingLocal: false,
    isMutatingByPlugin: {},
    readmeByPlugin: {}
  })
  return installedPlugin
}

function getFieldSelectTrigger(label: string) {
  const labelEl = screen.getByText(label)
  const fieldContainer = labelEl.closest('[data-slot="field"]')
  if (!fieldContainer) throw new Error(`No field container for "${label}"`)
  const trigger = fieldContainer.querySelector('[role="combobox"]')
  if (!trigger) throw new Error(`No combobox trigger inside "${label}" field`)
  return trigger as HTMLElement
}

function mountPanel(plugin: PluginInstalledItem) {
  const appConfig = useAppStore.getState().appConfig
  return render(
    <PluginDetailPanel
      appConfig={appConfig}
      selectedItem={{
        name: plugin.name,
        fullName: plugin.fullName,
        author: plugin.author,
        description: plugin.description,
        logo: plugin.logo,
        version: plugin.version,
        homepage: plugin.homepage,
        hasInstall: true,
        installedPlugin: plugin
      } as never}
      plugin={plugin}
      activeTab={pluginDetailTab.Config}
      availableTabs={[pluginDetailTab.Readme, pluginDetailTab.Config]}
      readmeState={null}
      isMutating={false}
      onTabChange={vi.fn()}
    />
  )
}

describe('PluginDetailPanel — config tab persistence (issue diagnostic)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Schema RPC default: re-evaluate with given draftValues (simulates main).
    vi.mocked(pluginsAdapter.refreshConfigSchema).mockImplementation(
      async (payload) => {
        const draftValues = (payload as { draftValues: Record<string, unknown> })
          .draftValues
        const evaluated = evaluatePluginConfig(
          buildRawPluginSchema() as Parameters<typeof evaluatePluginConfig>[0],
          draftValues
        ) as unknown[]
        return normalizePluginConfigSchema(evaluated)
      }
    )
  })

  it('shows saved advanced/debug/v2 when appConfig.plugins[fullName] has those values', async () => {
    // Simulates the desired post-save state: appConfig.plugins[fullName] has the
    // values the user just saved.
    const plugin = setupStore({
      mode: 'advanced',
      verbosity: 'debug',
      apiVersion: 'v2'
    })

    mountPanel(plugin)

    // No initial sync wired yet in the panel — schema stays basic-state.
    // But form values come from appConfig.plugins[fullName], so mode should
    // at least show 'advanced'.
    await waitFor(() => {
      const modeTrigger = getFieldSelectTrigger('Mode')
      expect(modeTrigger.textContent).toContain('advanced')
    })

    // Without the schema sync, verbosity/apiVersion values are saved but
    // the basic-state choices don't include them, so they render as
    // placeholder (field.name). This documents the current broken state
    // and gives us a failing assertion to fix.
    const verbosityTrigger = getFieldSelectTrigger('Verbosity')
    const apiVersionTrigger = getFieldSelectTrigger('API version')
    // After fix: these should contain 'debug' / 'v2'
    expect(verbosityTrigger.textContent).toContain('debug')
    expect(apiVersionTrigger.textContent).toContain('v2')
  })

  it('shows saved values end-to-end: user toggles mode, clicks Confirm, form retains new values', async () => {
    // Step 1: empty starting state — no saved plugin config.
    const plugin = setupStore(undefined)

    const { rerender } = mountPanel(plugin)

    // Step 2: simulate the cascade — user changed mode to 'advanced',
    // hook fetched new schema, form values updated to advanced/debug/v2.
    // We can't drive Radix Select interactions in jsdom reliably, so
    // we simulate the save call directly with the post-cascade values.
    vi.mocked(pluginsAdapter.savePluginConfig).mockResolvedValueOnce(undefined)
    vi.mocked(pluginsAdapter.getInstalledPlugins).mockResolvedValueOnce([
      plugin as never
    ])
    vi.mocked(appActions.refreshAppConfig).mockImplementationOnce(async () => {
      // Simulate what refreshAppConfig SHOULD do after picgo-core writes the
      // plugin config: appConfig.plugins[fullName] becomes the saved values.
      useAppStore.setState((state) => {
        if (!state.appConfig) return
        state.appConfig.plugins[FULL_NAME] = {
          mode: 'advanced',
          verbosity: 'debug',
          apiVersion: 'v2'
        }
      })
    })

    await act(async () => {
      await pluginStoreActions.savePluginConfig(FULL_NAME, 'config', {
        mode: 'advanced',
        verbosity: 'debug',
        apiVersion: 'v2'
      })
    })

    // Re-render so the panel picks up new appConfig reference.
    const nextAppConfig = useAppStore.getState().appConfig
    rerender(
      <PluginDetailPanel
        appConfig={nextAppConfig}
        selectedItem={{
          name: plugin.name,
          fullName: plugin.fullName,
          author: plugin.author,
          description: plugin.description,
          logo: plugin.logo,
          version: plugin.version,
          homepage: plugin.homepage,
          hasInstall: true,
          installedPlugin: plugin
        } as never}
        plugin={plugin}
        activeTab={pluginDetailTab.Config}
        availableTabs={[pluginDetailTab.Readme, pluginDetailTab.Config]}
        readmeState={null}
        isMutating={false}
        onTabChange={vi.fn()}
      />
    )

    // Verify saved values are visible after save.
    await waitFor(() => {
      const modeTrigger = getFieldSelectTrigger('Mode')
      expect(modeTrigger.textContent).toContain('advanced')
    })

    expect(getFieldSelectTrigger('Verbosity').textContent).toContain('debug')
    expect(getFieldSelectTrigger('API version').textContent).toContain('v2')
  })
})
