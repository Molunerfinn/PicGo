// @vitest-environment jsdom

import { render, screen , fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@/adapters/plugins', () => ({
  pluginsAdapter: {
    reloadApp: vi.fn()
  }
}))

import { AppReloadBar } from '@/components/common/app-reload-bar'
import { PluginSidebar, type PluginSidebarListItem } from '@/components/main/plugins/plugin-sidebar'
import { useAppStore } from '@/store/app-store'
import { usePluginStore } from '@/store/plugins/store'
import { pluginsAdapter } from '@/adapters/plugins'
import { IPasteStyle, IStartupMode } from '~/universal/types/enum'

function resetStores () {
  useAppStore.setState({
    defaultPicBed: 'smms',
    appConfig: {
      picBed: {
        uploader: 'smms',
        current: 'smms',
        transformer: 'path',
        proxy: '',
        list: []
      },
      uploader: {},
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
        server: {
          port: 36677,
          host: '127.0.0.1',
          enable: true
        },
        startupMode: IStartupMode.HIDE,
        shortKey: {},
        urlRewrite: {
          rules: []
        }
      },
      picgoPlugins: {},
      plugins: {},
      transformer: {},
      needReload: false
    },
    picBeds: [],
    providers: [],
    providerSchemas: {},
    pluginsInstalled: [],
    settingsVersion: {
      currentVersion: '2.5.3',
      latestVersion: null
    },
    hasHydrated: true,
    hasSettingsHydrated: true,
    picgoCloud: {
      loginStatus: 'IDLE',
      loginError: null,
      hasAgreedToTermsAndPrivacy: false
    }
  })

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
}

function createSidebarItems (): PluginSidebarListItem[] {
  return [
    {
      fullName: 'picgo-plugin-cloudflare-r2-xqv',
      name: 'cloudflare-r2-xqv',
      description: 'picgo for cloudflare-r2 storage',
      author: 'xiaoqinvar',
      version: '1.0.4',
      logo: '',
      homepage: '',
      hasInstall: true,
      installedPlugin: {
        name: 'cloudflare-r2-xqv',
        fullName: 'picgo-plugin-cloudflare-r2-xqv',
        author: 'xiaoqinvar',
        description: 'picgo for cloudflare-r2 storage',
        logo: '',
        version: '1.0.4',
        gui: true,
        homepage: '',
        enabled: true,
        hasInstall: true,
        guiMenu: [],
        config: {
          plugin: { name: 'x', fullName: 'x', config: [] },
          transformer: { name: 'path', fullName: 'path', config: [] }
        }
      }
    }
  ]
}

describe('renderer/plugins components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  it('shows reload bar only when needReload is true and triggers reload action', async () => {
    const { rerender } = render(<AppReloadBar />)

    expect(screen.queryByText('TIPS_NEED_RELOAD')).not.toBeInTheDocument()

    useAppStore.setState((state) => {
      if (state.appConfig) {
        state.appConfig.needReload = true
      }
    })

    rerender(<AppReloadBar />)

    const button = await screen.findByRole('button', { name: 'TIPS_NEED_RELOAD' })
    fireEvent.click(button)

    expect(vi.mocked(pluginsAdapter.reloadApp)).toHaveBeenCalled()
  })

  it('shows import loading state and clears search input through store actions', async () => {
    const onImportLocalPlugin = vi.fn()

    usePluginStore.setState({
      searchValue: 'cloudflare',
      isImportingLocal: true
    })

    render(
      <PluginSidebar
        items={createSidebarItems()}
        selectedPluginFullName={null}
        onSelectPlugin={vi.fn()}
        onInstallPlugin={vi.fn()}
        onOpenAwesomeList={vi.fn()}
        onImportLocalPlugin={onImportLocalPlugin}
        onOpenPluginMenu={vi.fn()}
      />
    )

    expect(screen.getByRole('textbox', { name: 'SEARCH' })).toHaveValue('cloudflare')

    const clearButton = screen.getByRole('button', { name: 'ALBUM_CLEAR_SELECTION' })
    fireEvent.click(clearButton)
    expect(usePluginStore.getState().searchValue).toBe('')

    const importButtons = screen.getAllByRole('button')
    const disabledImportButton = importButtons.find((button) => button.hasAttribute('disabled'))
    expect(disabledImportButton).toBeDefined()
  })
})
