// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  ensureExpanded: vi.fn(),
  ensureHydrated: vi.fn(async () => {}),
  navigate: vi.fn(),
  refreshConfigSchema: vi.fn(),
  setHydrating: vi.fn()
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => ({
    uploader: 'tcyun',
    configId: 'config-1'
  })
}))

vi.mock('@/adapters/plugins', () => ({
  pluginsAdapter: {
    refreshConfigSchema: mocks.refreshConfigSchema
  }
}))

vi.mock('@/store', () => ({
  appActions: {
    ensureHydrated: mocks.ensureHydrated
  },
  providerStoreActions: {
    ensureExpanded: mocks.ensureExpanded,
    setHydrating: mocks.setHydrating
  },
  useAppStore: {
    use: {
      appConfig: () => ({
        picBed: {
          uploader: 'tcyun'
        },
        uploader: {
          tcyun: {
            defaultId: 'config-1',
            configList: [
              {
                _id: 'config-1',
                _configName: 'Existing Config',
                _createdAt: 1700000000000,
                _updatedAt: 1700000000000,
                secretKey: 'existing-secret-key'
              }
            ]
          }
        }
      }),
      providers: () => [
        {
          id: 'tcyun',
          name: 'Tencent Cloud',
          visible: true,
          isDefaultUploader: true
        }
      ],
      hasHydrated: () => true
    }
  },
  useProviderStore: {
    use: {
      isHydrating: () => false
    }
  }
}))

vi.mock('@/components/main/providers/provider-sidebar', () => ({
  ProviderSidebar: ({
    onCreateIntent
  }: {
    onCreateIntent: (uploaderId: string) => void
  }) => (
    <button type='button' onClick={() => onCreateIntent('tcyun')}>
      Open create dialog
    </button>
  )
}))

vi.mock('@/components/main/providers/provider-config-panel', () => ({
  ProviderConfigPanel: ({
    draftConfigMap
  }: {
    draftConfigMap: Record<string, unknown>
  }) => (
    <output data-testid='draft-config'>{JSON.stringify(draftConfigMap)}</output>
  )
}))

vi.mock('@/components/main/providers/provider-config-name-dialog', () => ({
  ProviderConfigNameDialog: ({
    state,
    onSubmit
  }: {
    state: { name: string } | null
    onSubmit: () => Promise<void>
  }) => state
    ? (
      <button type='button' onClick={async () => await onSubmit()}>
        Submit create dialog
      </button>
    )
    : null
}))

vi.mock('@/components/main/providers/provider-delete-config-dialog', () => ({
  ProviderDeleteConfigDialog: () => null
}))

import { PicGoProviders } from '@/components/main/providers/picgo-providers'

describe('PicGoProviders create config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.refreshConfigSchema.mockResolvedValue([
      {
        name: 'version',
        type: 'list',
        choices: ['v4', 'v5'],
        default: 'v5',
        required: false
      },
      {
        name: 'secretKey',
        type: 'password',
        default: '',
        required: true
      }
    ])
  })

  it('requests schema-only defaults and creates an empty credential draft', async () => {
    render(<PicGoProviders />)

    fireEvent.click(screen.getByRole('button', { name: 'Open create dialog' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit create dialog' }))

    await waitFor(() => {
      expect(mocks.refreshConfigSchema).toHaveBeenCalledWith({
        target: 'uploader',
        uploaderName: 'tcyun',
        draftValues: {},
        schemaOnly: true
      })
    })

    await waitFor(() => {
      const draftMap = JSON.parse(
        screen.getByTestId('draft-config').textContent ?? '{}'
      ) as Record<string, Record<string, unknown>>
      expect(draftMap.tcyun).toMatchObject({
        _configName: 'New Config',
        _isDraft: true,
        version: 'v5',
        secretKey: ''
      })
    })
  })
})
