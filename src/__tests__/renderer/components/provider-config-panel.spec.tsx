// @vitest-environment jsdom

import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { evaluatePluginConfig } from 'picgo'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  )
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearch: () => ({
      uploader: 'picgo-plugin-test',
      configId: 'config-1'
    })
  }
})

vi.mock('@/adapters/plugins', () => ({
  pluginsAdapter: {
    refreshConfigSchema: vi.fn(async () => [])
  }
}))

vi.mock('@/store/providers/actions', () => ({
  providerStoreActions: {
    ensureSchema: vi.fn(async () => {}),
    setDefaultConfig: vi.fn(),
    setLoadingByProvider: vi.fn(),
    saveConfig: vi.fn(),
    createConfig: vi.fn()
  }
}))

import { ProviderConfigPanel } from '@/components/main/providers/provider-config-panel'
import { useAppStore } from '@/store/app-store'
import { useProviderStoreBase as useProviderStore } from '@/store/providers/store'
import { pluginsAdapter } from '@/adapters/plugins'
import { normalizePluginConfigSchema } from '@/components/common/normalize-plugin-schema'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'
import { buildCascadeRawSchema } from '../fixtures/cascade-fixture'

const baseAppConfig = {
  picBed: {
    uploader: 'picgo-plugin-test',
    current: 'picgo-plugin-test',
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
  plugins: {},
  transformer: {},
  needReload: false
}

function setupStoreWithSavedConfig(savedConfig: Record<string, unknown>) {
  // Mimics what the main process sends at startup: schema evaluated with
  // empty answers, so the plugin's `default(answers)` for downstream fields
  // computes against synthAnswers defaults — NOT the user's saved values.
  // Provider-config-panel then has to issue an initial sync to bring the
  // schema in line with the saved values.
  const initialSchema = evaluatePluginConfig(
    buildCascadeRawSchema(savedConfig.region as string) as Parameters<
      typeof evaluatePluginConfig
    >[0]
  ) as unknown[]

  useAppStore.setState({
    defaultPicBed: 'picgo-plugin-test',
    appConfig: {
      ...baseAppConfig,
      uploader: {
        'picgo-plugin-test': {
          defaultId: 'config-1',
          configList: [
            {
              _id: 'config-1',
              _configName: 'New Config',
              _createdAt: 1700000000000,
              _updatedAt: 1700000000000,
              ...savedConfig
            }
          ]
        }
      }
    } as never,
    picBeds: [],
    providers: [
      {
        id: 'picgo-plugin-test',
        name: 'PicGo Test',
        visible: true,
        isDefaultUploader: true
      }
    ],
    providerSchemas: {
      'picgo-plugin-test': {
        id: 'picgo-plugin-test',
        name: 'PicGo Test',
        config: normalizePluginConfigSchema(initialSchema)
      }
    },
    pluginsInstalled: [],
    settingsVersion: { currentVersion: '2.5.3', latestVersion: null },
    hasHydrated: true,
    hasSettingsHydrated: true,
    picgoCloud: {
      loginStatus: 'IDLE',
      loginError: null,
      hasAgreedToTermsAndPrivacy: false
    }
  } as never)

  useProviderStore.setState({
    isHydrating: false,
    isLoadingByProvider: {},
    expandedProviderIds: [],
    searchValue: ''
  })
}

// Mock fetchSchema to mirror what the main side would compute when given
// `draftValues` — i.e. re-evaluate the raw schema with those answers so
// downstream choices/defaults reflect them.
function mockMainSideEvaluator() {
  vi.mocked(pluginsAdapter.refreshConfigSchema).mockImplementation(
    async (payload) => {
      const draftValues = (payload as { draftValues: Record<string, unknown> })
        .draftValues
      const evaluated = evaluatePluginConfig(
        buildCascadeRawSchema(draftValues.region as string | undefined) as Parameters<
          typeof evaluatePluginConfig
        >[0],
        draftValues
      ) as unknown[]
      return normalizePluginConfigSchema(evaluated)
    }
  )
}

function getFieldSelectTrigger(label: string) {
  const labelEl = screen.getByText(label)
  const fieldContainer = labelEl.closest('[data-slot="field"]')
  if (!fieldContainer) throw new Error(`No field container for "${label}"`)
  const trigger = fieldContainer.querySelector('[role="combobox"]')
  if (!trigger) throw new Error(`No combobox trigger inside "${label}" field`)
  return trigger as HTMLElement
}

function renderPanel() {
  return render(
    <ProviderConfigPanel
      draftConfigMap={{}}
      setDraftConfigMap={vi.fn()}
      onCreateConfigIntent={vi.fn()}
      onDeleteConfigIntent={vi.fn()}
    />
  )
}

describe('ProviderConfigPanel — page-refresh saved config rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMainSideEvaluator()
  })

  it('renders the saved bucket value in the Select trigger after page refresh', async () => {
    setupStoreWithSavedConfig({
      region: 'eu',
      endpoint: 's3.eu-central-1',
      bucket: 'eu-central-prod',
      pathPrefix: ''
    })

    renderPanel()

    await waitFor(
      () => {
        const bucketTrigger = getFieldSelectTrigger('Bucket')
        expect(bucketTrigger.textContent).toContain('eu-central-prod')
      },
      { timeout: 1000 }
    )

    expect(getFieldSelectTrigger('Region').textContent).toContain('eu')
    expect(getFieldSelectTrigger('Endpoint').textContent).toContain(
      's3.eu-central-1'
    )
  })

  it('triggers an initial schema sync with the saved values when mounting', async () => {
    setupStoreWithSavedConfig({
      region: 'eu',
      endpoint: 's3.eu-central-1',
      bucket: 'eu-central-prod',
      pathPrefix: ''
    })

    renderPanel()

    await waitFor(() => {
      expect(pluginsAdapter.refreshConfigSchema).toHaveBeenCalled()
    })

    const firstCall = vi.mocked(pluginsAdapter.refreshConfigSchema).mock
      .calls[0]?.[0] as {
      target: string
      uploaderName: string
      draftValues: Record<string, unknown>
    }
    expect(firstCall?.target).toBe('uploader')
    expect(firstCall?.uploaderName).toBe('picgo-plugin-test')
    expect(firstCall?.draftValues).toMatchObject({
      region: 'eu',
      endpoint: 's3.eu-central-1',
      bucket: 'eu-central-prod'
    })
  })

  it('does not clear saved values when the initial schema sync resolves', async () => {
    setupStoreWithSavedConfig({
      region: 'eu',
      endpoint: 's3.eu-central-1',
      bucket: 'eu-central-prod',
      pathPrefix: ''
    })

    renderPanel()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })

    expect(getFieldSelectTrigger('Region').textContent).toContain('eu')
    expect(getFieldSelectTrigger('Endpoint').textContent).toContain(
      's3.eu-central-1'
    )
    expect(getFieldSelectTrigger('Bucket').textContent).toContain(
      'eu-central-prod'
    )
  })
})

// User-driven cascade (region change → endpoint/bucket update) is verified
// at the hook level in `cascade-end-to-end.spec.tsx` — Radix Select in jsdom
// requires `@testing-library/user-event` (not installed) to reliably open
// its portal dropdown, and the panel here is a thin wrapper around the
// same hook. Adding a panel-level cascade test would duplicate coverage
// without adding signal.

describe('ProviderConfigPanel — editor field rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMainSideEvaluator()
  })

  it('renders a textarea for a type: editor field and binds its saved value', async () => {
    // Re-setup the store with a schema that includes a type: editor field.
    // We bypass the cascade fixture here because editor type is orthogonal
    // to the region/endpoint/bucket cascade and we just want to verify the
    // SchemaFormFields editor branch surfaces through the panel render path.
    useAppStore.setState({
      defaultPicBed: 'picgo-plugin-test',
      appConfig: {
        ...baseAppConfig,
        uploader: {
          'picgo-plugin-test': {
            defaultId: 'config-1',
            configList: [
              {
                _id: 'config-1',
                _configName: 'New Config',
                _createdAt: 1700000000000,
                _updatedAt: 1700000000000,
                script: 'line-one\nline-two\nline-three'
              }
            ]
          }
        }
      } as never,
      picBeds: [],
      providers: [
        {
          id: 'picgo-plugin-test',
          name: 'PicGo Test',
          visible: true,
          isDefaultUploader: true
        }
      ],
      providerSchemas: {
        'picgo-plugin-test': {
          id: 'picgo-plugin-test',
          name: 'PicGo Test',
          config: normalizePluginConfigSchema([
            {
              name: 'script',
              type: 'editor',
              alias: 'Compression script',
              required: true,
              message: 'Enter your compression script'
            }
          ])
        }
      },
      pluginsInstalled: [],
      settingsVersion: { currentVersion: '2.5.3', latestVersion: null },
      hasHydrated: true,
      hasSettingsHydrated: true,
      picgoCloud: {
        loginStatus: 'IDLE',
        loginError: null,
        hasAgreedToTermsAndPrivacy: false
      }
    } as never)
    useProviderStore.setState({
      isHydrating: false,
      isLoadingByProvider: {},
      expandedProviderIds: [],
      searchValue: ''
    })

    renderPanel()

    await waitFor(() => {
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea.value).toBe('line-one\nline-two\nline-three')
    })
  })
})
