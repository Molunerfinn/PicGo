import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { IpcMainInvokeEvent } from 'electron'
import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { IRPCActionType } from '~/universal/types/enum'
import { IPicGoCloudConfigSyncToastType } from '#/types/cloudConfigSync'

type OnAskEncryptionSwitch = (context: { from: string; to: string }) => Promise<boolean>

type SyncImplementation = (askSwitch?: OnAskEncryptionSwitch) => Promise<{ status: string; message?: string }>

const showMessageBoxMock = vi.fn()
const showInputBoxMock = vi.fn()
const getUserInfoMock = vi.fn()
const getConfigMock = vi.fn()
const saveConfigMock = vi.fn()
const i18nTranslateMock = vi.fn((key: string) => key)

let baseDir = ''
let syncImplementation: SyncImplementation | null = null

const createInvokeEvent = (): IpcMainInvokeEvent => {
  const event = {
    sender: {
      send: vi.fn()
    }
  }
  return event as unknown as IpcMainInvokeEvent
}

vi.mock('@core/picgo', () => {
  return {
    default: {
      get baseDir () {
        return baseDir
      },
      getConfig: getConfigMock,
      saveConfig: saveConfigMock,
      cloud: {
        getUserInfo: getUserInfoMock,
        login: vi.fn(),
        logout: vi.fn(),
        disposeLoginFlow: vi.fn()
      },
      i18n: {
        translate: i18nTranslateMock
      }
    }
  }
})

vi.mock('apis/gui', () => {
  return {
    default: {
      getInstance: () => ({
        showInputBox: showInputBoxMock,
        showMessageBox: showMessageBoxMock
      })
    }
  }
})

vi.mock('apis/core/picgo/logger', () => {
  return {
    default: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  }
})

vi.mock('picgo', () => {
  const SyncStatus = {
    SUCCESS: 'success',
    CONFLICT: 'conflict',
    FAILED: 'failed'
  }
  const EncryptionMethod = {
    AUTO: 'auto',
    SSE: 'sse',
    E2EE: 'e2ee'
  }
  const E2EAskPinReason = {
    SETUP: 'setup',
    DECRYPT: 'decrypt',
    RETRY: 'retry'
  }
  const ConflictType = {
    CONFLICT: 'conflict'
  }

  class ConfigSyncManager {
    private readonly onAskEncryptionSwitch?: OnAskEncryptionSwitch

    constructor (_ctx: unknown, options: { onAskEncryptionSwitch?: OnAskEncryptionSwitch } = {}) {
      this.onAskEncryptionSwitch = options.onAskEncryptionSwitch
    }

    async sync (): Promise<{ status: string; message?: string }> {
      if (syncImplementation) {
        return syncImplementation(this.onAskEncryptionSwitch)
      }
      return { status: SyncStatus.SUCCESS }
    }
  }

  return {
    ConfigSyncManager,
    ConflictType,
    E2EAskPinReason,
    EncryptionMethod,
    SyncStatus
  }
})

describe('config sync encryption switch confirmation (main)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    syncImplementation = null
    getConfigMock.mockReturnValue(undefined)
    getUserInfoMock.mockResolvedValue({ user: 'tester' })
    i18nTranslateMock.mockImplementation((key: string) => key)
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'picgo-gui-config-sync-'))
  })

  afterEach(async () => {
    if (baseDir) {
      await fs.remove(baseDir)
    }
  })

  it('prompts for confirmation and proceeds on confirm', async () => {
    showMessageBoxMock.mockResolvedValue({ result: 0, checkboxChecked: false })
    syncImplementation = async (askSwitch) => {
      if (askSwitch) {
        const confirmed = await askSwitch({ from: 'e2ee', to: 'sse' })
        if (!confirmed) {
          return { status: 'failed', message: i18nTranslateMock('CONFIG_SYNC_ENCRYPTION_SWITCH_CANCELLED') }
        }
      }
      return { status: 'success', message: 'ok' }
    }

    const { cloudRouter } = await import('../../main/events/rpc/routes/cloud')
    const handler = cloudRouter.routes().get(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_START)
    const res = await handler?.([], createInvokeEvent())

    expect(showMessageBoxMock).toHaveBeenCalledTimes(1)
    expect(showMessageBoxMock).toHaveBeenCalledWith({
      title: 'PICGO_CLOUD_CONFIG_SYNC_ENCRYPTION_SWITCH_TITLE',
      message: 'PICGO_CLOUD_CONFIG_SYNC_ENCRYPTION_SWITCH_BODY',
      type: 'warning',
      buttons: [
        'PICGO_CLOUD_CONFIG_SYNC_ENCRYPTION_SWITCH_CONFIRM',
        'PICGO_CLOUD_CONFIG_SYNC_ENCRYPTION_SWITCH_CANCEL'
      ]
    })
    expect(res?.success).toBe(true)
    expect(res?.data.toastType).toBe(IPicGoCloudConfigSyncToastType.SUCCESS)
    expect(res?.data.message).toBe('PICGO_CLOUD_CONFIG_SYNC_SUCCESS')
  })

  it('maps encryption-switch cancel to warning', async () => {
    showMessageBoxMock.mockResolvedValue({ result: 1, checkboxChecked: false })
    syncImplementation = async (askSwitch) => {
      if (askSwitch) {
        const confirmed = await askSwitch({ from: 'sse', to: 'e2ee' })
        if (!confirmed) {
          return { status: 'failed', message: i18nTranslateMock('CONFIG_SYNC_ENCRYPTION_SWITCH_CANCELLED') }
        }
      }
      return { status: 'success', message: 'ok' }
    }

    const { cloudRouter } = await import('../../main/events/rpc/routes/cloud')
    const handler = cloudRouter.routes().get(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_START)
    const res = await handler?.([], createInvokeEvent())

    expect(showMessageBoxMock).toHaveBeenCalledTimes(1)
    expect(res?.success).toBe(true)
    expect(res?.data.toastType).toBe(IPicGoCloudConfigSyncToastType.WARNING)
    expect(res?.data.message).toBe('PICGO_CLOUD_CONFIG_SYNC_ENCRYPTION_SWITCH_CANCELLED')
  })
})
