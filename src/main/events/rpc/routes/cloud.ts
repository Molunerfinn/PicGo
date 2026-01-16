import { IRPCActionType } from '~/universal/types/enum'
import { RPCRouter } from '../router'
import picgo from '@core/picgo'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import axios from 'axios'
import { T } from '~/main/i18n'
import { fail, ok } from '../utils'
import GuiApi from 'apis/gui'
import fs from 'fs-extra'
import { parse } from 'comment-json'
import { cloneDeep, isPlainObject, set, unset } from 'lodash'
import path from 'path'
import {
  ConfigSyncManager,
  ConflictType,
  E2EAskPinReason,
  SyncStatus,
  type IDiffNode,
  type IConfig
} from 'picgo'
import {
  IPicGoCloudConfigSyncConflictChoice,
  IPicGoCloudConfigSyncRunStatus,
  IPicGoCloudConfigSyncSessionStatus,
  IPicGoCloudConfigSyncToastType,
  type IPicGoCloudConfigSyncConflictItem,
  type IPicGoCloudConfigSyncResolution,
  type IPicGoCloudConfigSyncRunResult,
  type IPicGoCloudConfigSyncState
} from '#/types/cloudConfigSync'

const cloudRouter = new RPCRouter()

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000
const USER_ABORTED_CODE = 'PICGO_CLOUD_CONFIG_SYNC_ABORTED'

type ICloudWithGetUserInfo = {
  getUserInfo: () => Promise<IPicGoCloudUserInfo | null>
}

const hasGetUserInfo = (cloud: unknown): cloud is ICloudWithGetUserInfo => {
  return typeof (cloud as { getUserInfo?: unknown }).getUserInfo === 'function'
}

/**
 * Config sync session state MUST live in the main process (memory only) so the UI can re-hydrate
 * after window hide/show without losing an in-progress/conflict state.
 */
let configSyncSessionStatus: IPicGoCloudConfigSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.IDLE
let configSyncConflictDiffTree: IDiffNode | null = null
let configSyncConflictItems: IPicGoCloudConfigSyncConflictItem[] = []
let configSyncManager: ConfigSyncManager | null = null
let notifyRemoteE2EPending: boolean = false

const clearConfigSyncSession = (): void => {
  configSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.IDLE
  configSyncConflictDiffTree = null
  configSyncConflictItems = []
}

const getLocalEnableE2EPreference = (): boolean | undefined => {
  const value = picgo.getConfig<unknown>('settings.picgoCloud.enableE2E')
  return typeof value === 'boolean' ? value : undefined
}

const popNotifyRemoteE2EOnce = (): boolean => {
  if (!notifyRemoteE2EPending) return false
  notifyRemoteE2EPending = false
  return true
}

const getSnapshotUpdatedAt = async (): Promise<string | undefined> => {
  try {
    const snapshotPath = path.join(picgo.baseDir, 'config.snapshot.json')
    if (!(await fs.pathExists(snapshotPath))) return undefined
    const content = await fs.readFile(snapshotPath, 'utf8')
    const parsed: unknown = parse(content)
    if (!isPlainObject(parsed)) return undefined
    const updatedAt = (parsed as { updatedAt?: unknown }).updatedAt
    return typeof updatedAt === 'string' && updatedAt ? updatedAt : undefined
  } catch {
    return undefined
  }
}

const buildConfigSyncState = async (options: { consumeNotifyOnce?: boolean } = {}): Promise<IPicGoCloudConfigSyncState> => {
  const notify = options.consumeNotifyOnce ? popNotifyRemoteE2EOnce() : notifyRemoteE2EPending
  return {
    sessionStatus: configSyncSessionStatus,
    enableE2E: getLocalEnableE2EPreference(),
    lastSyncedAt: await getSnapshotUpdatedAt(),
    conflicts: configSyncSessionStatus === IPicGoCloudConfigSyncSessionStatus.CONFLICT ? configSyncConflictItems : undefined,
    ...(notify ? { notifyRemoteE2EOnce: true } : {})
  }
}

const readLocalConfigWithComments = async (): Promise<IConfig> => {
  if (!(await fs.pathExists(picgo.configPath))) {
    return picgo.getConfig<IConfig>()
  }
  const content = await fs.readFile(picgo.configPath, 'utf8')
  const parsed: unknown = parse(content)
  if (!isPlainObject(parsed)) {
    throw new Error(T('PICGO_CLOUD_CONFIG_SYNC_LOCAL_CONFIG_INVALID'))
  }
  return parsed as IConfig
}

const extractConflictItems = (diffTree: IDiffNode): IPicGoCloudConfigSyncConflictItem[] => {
  const items: IPicGoCloudConfigSyncConflictItem[] = []

  const walk = (node: IDiffNode, pathSegments: string[]) => {
    const nextSegments = node.key === 'root' ? pathSegments : [...pathSegments, node.key]

    if (node.status === ConflictType.CONFLICT) {
      // If the conflict is an object-level aggregation, surface leaf conflicts instead.
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => walk(child, nextSegments))
        return
      }

      items.push({
        path: nextSegments.join('.'),
        localValue: node.localValue,
        remoteValue: node.remoteValue
      })
      return
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => walk(child, nextSegments))
    }
  }

  walk(diffTree, [])
  return items
}

const localizeConfigSyncResult = (status: SyncStatus, message: string | undefined): { message: string, toastType: IPicGoCloudConfigSyncToastType } => {
  if (status === SyncStatus.SUCCESS) {
    return {
      message: T('PICGO_CLOUD_CONFIG_SYNC_SUCCESS'),
      toastType: IPicGoCloudConfigSyncToastType.SUCCESS
    }
  }

  if (status === SyncStatus.CONFLICT) {
    return {
      message: T('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_DETECTED'),
      toastType: IPicGoCloudConfigSyncToastType.INFO
    }
  }

  const raw = message || T('PICGO_CLOUD_CONFIG_SYNC_FAILED')

  if (raw === USER_ABORTED_CODE || raw === 'Invalid PIN input') {
    return {
      message: T('PICGO_CLOUD_CONFIG_SYNC_ABORTED'),
      toastType: IPicGoCloudConfigSyncToastType.WARNING
    }
  }

  if (raw === 'Maximum retry attempts exceeded') {
    return {
      message: T('PICGO_CLOUD_CONFIG_SYNC_PIN_MAX_RETRY'),
      toastType: IPicGoCloudConfigSyncToastType.ERROR
    }
  }

  return {
    message: T('PICGO_CLOUD_CONFIG_SYNC_FAILED_WITH_REASON', { reason: raw }),
    toastType: IPicGoCloudConfigSyncToastType.ERROR
  }
}

const getConfigSyncManager = (): ConfigSyncManager => {
  if (configSyncManager) return configSyncManager

  const guiApi = GuiApi.getInstance()
  configSyncManager = new ConfigSyncManager(picgo, {
    onAskPin: async (reason: E2EAskPinReason, retryCount: number) => {
      const inputOptions: IShowInputBoxOption = {
        title: (() => {
          if (reason === E2EAskPinReason.SETUP) return T('PICGO_CLOUD_E2E_PIN_SETUP_TITLE')
          if (reason === E2EAskPinReason.DECRYPT) return T('PICGO_CLOUD_E2E_PIN_DECRYPT_TITLE')
          return T('PICGO_CLOUD_E2E_PIN_RETRY_TITLE', { retryCount })
        })(),
        placeholder: T('PICGO_CLOUD_E2E_PIN_PLACEHOLDER'),
        inputType: 'password',
        width: 520,
        confirm: reason === E2EAskPinReason.SETUP
          ? { placeholder: T('PICGO_CLOUD_E2E_PIN_CONFIRM_PLACEHOLDER') }
          : undefined
      }

      const value = await guiApi.showInputBox(inputOptions)
      if (!value) {
        // Throw a sentinel code so we can treat it as a user-aborted flow in the GUI.
        throw new Error(USER_ABORTED_CODE)
      }
      return value
    }
  })

  return configSyncManager
}

const buildResolvedConfig = async (resolution: IPicGoCloudConfigSyncResolution): Promise<IConfig> => {
  const base = await readLocalConfigWithComments()

  for (const item of configSyncConflictItems) {
    const choice = resolution[item.path]
    if (choice === IPicGoCloudConfigSyncConflictChoice.CLOUD) {
      if (item.remoteValue === undefined) {
        unset(base, item.path)
      } else {
        set(base, item.path, cloneDeep(item.remoteValue))
      }
    }
  }

  return base
}

const getUserInfo = async (): Promise<IPicGoCloudUserInfo | null> => {
  const cloud = picgo.cloud
  if (hasGetUserInfo(cloud)) {
    return await cloud.getUserInfo()
  }

  // Backward-compatible fallback (for older picgo-core versions without `cloud.getUserInfo`).
  const token = picgo.getConfig<string | undefined>('settings.picgoCloud.token')
  if (!token) return null

  type IAxiosErrorLike = {
    response?: {
      status?: number
      data?: unknown
    }
    message?: string
  }

  const baseURL = process.env.PICGO_CLOUD_API_URL || 'https://picgo.app'
  try {
    const res = await axios.request<IPicGoCloudUserInfo>({
      method: 'GET',
      baseURL,
      url: '/api/whoami',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return res.data
  } catch (e: unknown) {
    const errorLike = (typeof e === 'object' && e !== null) ? (e as IAxiosErrorLike) : null
    const status = errorLike?.response?.status
    if (status === 401 || status === 403) {
      // Treat invalid token as logged-out and clear it for later retries.
      picgo.cloud.logout()
      return null
    }
    const message = (errorLike?.response?.data as { message?: string } | undefined)?.message
      ?? errorLike?.message
      ?? String(e)
    throw new Error(message)
  }
}

const loginWithTimeout = async (): Promise<void> => {
  const loginPromise = picgo.cloud.login()

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      picgo.cloud.disposeLoginFlow()
      reject(new Error(T('PICGO_CLOUD_LOGIN_TIMEOUT')))
    }, LOGIN_TIMEOUT_MS)
  })

  try {
    await Promise.race([loginPromise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    // Avoid unhandled rejection when timeout disposes the core login flow.
    loginPromise.catch(() => {})
  }
}

cloudRouter
  .add(IRPCActionType.PICGO_CLOUD_GET_USER_INFO, async () => {
    try {
      const userInfo = await getUserInfo()
      return ok(userInfo)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_LOGIN, async () => {
    try {
      await loginWithTimeout()
      const userInfo = await getUserInfo()
      if (!userInfo) {
        return fail(T('PICGO_CLOUD_LOGIN_FAILED'))
      }
      return ok(userInfo)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_LOGOUT, async () => {
    try {
      picgo.cloud.logout()
      clearConfigSyncSession()
      return ok(true)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_DISPOSE_LOGIN_FLOW, async () => {
    try {
      picgo.cloud.disposeLoginFlow()
      return ok(true)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_GET_STATE, async () => {
    try {
      return ok(await buildConfigSyncState({ consumeNotifyOnce: true }))
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_SET_E2E_PREFERENCE, async (args) => {
    try {
      const [enable] = args as [boolean]
      picgo.saveConfig({
        'settings.picgoCloud.enableE2E': enable
      })
      return ok(getLocalEnableE2EPreference())
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_ABORT, async () => {
    try {
      clearConfigSyncSession()
      return ok(await buildConfigSyncState())
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_START, async () => {
    const fallbackState = await buildConfigSyncState()

    if (configSyncSessionStatus === IPicGoCloudConfigSyncSessionStatus.SYNCING) {
      const runRes: IPicGoCloudConfigSyncRunResult = {
        status: IPicGoCloudConfigSyncRunStatus.FAILED,
        message: T('PICGO_CLOUD_CONFIG_SYNC_IN_PROGRESS'),
        toastType: IPicGoCloudConfigSyncToastType.INFO,
        state: fallbackState
      }
      return ok(runRes)
    }

    if (configSyncSessionStatus === IPicGoCloudConfigSyncSessionStatus.CONFLICT) {
      const runRes: IPicGoCloudConfigSyncRunResult = {
        status: IPicGoCloudConfigSyncRunStatus.CONFLICT,
        message: T('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_PENDING'),
        toastType: IPicGoCloudConfigSyncToastType.INFO,
        state: fallbackState
      }
      return ok(runRes)
    }

    configSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.SYNCING

    const enableE2EBefore = getLocalEnableE2EPreference()

    try {
      const userInfo = await getUserInfo()
      if (!userInfo) {
        clearConfigSyncSession()
        const runRes: IPicGoCloudConfigSyncRunResult = {
          status: IPicGoCloudConfigSyncRunStatus.FAILED,
          message: T('PICGO_CLOUD_LOGIN_EXPIRED'),
          toastType: IPicGoCloudConfigSyncToastType.WARNING,
          authInvalidated: true,
          state: await buildConfigSyncState()
        }
        return ok(runRes)
      }

      const manager = getConfigSyncManager()
      const res = await manager.sync()

      const enableE2EAfter = getLocalEnableE2EPreference()
      if (enableE2EBefore === undefined && enableE2EAfter === true) {
        // ConfigSyncManager auto-enables local enableE2E when remote is encrypted.
        notifyRemoteE2EPending = true
      }

      if (res.status === SyncStatus.CONFLICT && res.diffTree) {
        configSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.CONFLICT
        configSyncConflictDiffTree = res.diffTree
        configSyncConflictItems = extractConflictItems(res.diffTree)
      } else {
        clearConfigSyncSession()
      }

      const localized = localizeConfigSyncResult(res.status, res.message)
      const runStatus = res.status === SyncStatus.SUCCESS
        ? IPicGoCloudConfigSyncRunStatus.SUCCESS
        : res.status === SyncStatus.CONFLICT
          ? IPicGoCloudConfigSyncRunStatus.CONFLICT
          : IPicGoCloudConfigSyncRunStatus.FAILED

      const runRes: IPicGoCloudConfigSyncRunResult = {
        status: runStatus,
        message: localized.message,
        toastType: localized.toastType,
        shouldShowRestartPrompt: res.status === SyncStatus.SUCCESS,
        state: await buildConfigSyncState({ consumeNotifyOnce: true })
      }
      return ok(runRes)
    } catch (e) {
      clearConfigSyncSession()
      const localized = localizeConfigSyncResult(SyncStatus.FAILED, e instanceof Error ? e.message : String(e))
      const runRes: IPicGoCloudConfigSyncRunResult = {
        status: IPicGoCloudConfigSyncRunStatus.FAILED,
        message: localized.message,
        toastType: localized.toastType,
        state: await buildConfigSyncState()
      }
      return ok(runRes)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_CONFIG_SYNC_APPLY_RESOLUTION, async (args) => {
    try {
      const [resolution] = args as [IPicGoCloudConfigSyncResolution]

      if (configSyncSessionStatus !== IPicGoCloudConfigSyncSessionStatus.CONFLICT || !configSyncConflictDiffTree) {
        const runRes: IPicGoCloudConfigSyncRunResult = {
          status: IPicGoCloudConfigSyncRunStatus.FAILED,
          message: T('PICGO_CLOUD_CONFIG_SYNC_NO_CONFLICT_SESSION'),
          toastType: IPicGoCloudConfigSyncToastType.ERROR,
          state: await buildConfigSyncState()
        }
        return ok(runRes)
      }

      const expectedPaths = new Set(configSyncConflictItems.map(item => item.path))
      const providedPaths = new Set(Object.keys(resolution))
      for (const path of expectedPaths) {
        if (!providedPaths.has(path)) {
          const runRes: IPicGoCloudConfigSyncRunResult = {
            status: IPicGoCloudConfigSyncRunStatus.FAILED,
            message: T('PICGO_CLOUD_CONFIG_SYNC_RESOLUTION_INCOMPLETE'),
            toastType: IPicGoCloudConfigSyncToastType.ERROR,
            state: await buildConfigSyncState()
          }
          return ok(runRes)
        }
      }

      const userInfo = await getUserInfo()
      if (!userInfo) {
        clearConfigSyncSession()
        const runRes: IPicGoCloudConfigSyncRunResult = {
          status: IPicGoCloudConfigSyncRunStatus.FAILED,
          message: T('PICGO_CLOUD_LOGIN_EXPIRED'),
          toastType: IPicGoCloudConfigSyncToastType.WARNING,
          authInvalidated: true,
          state: await buildConfigSyncState()
        }
        return ok(runRes)
      }

      configSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.SYNCING

      const resolvedConfig = await buildResolvedConfig(resolution)

      const enableE2E = getLocalEnableE2EPreference()
      const manager = getConfigSyncManager()
      const applyRes = await manager.applyResolvedConfig(resolvedConfig, enableE2E === undefined ? {} : { useE2E: enableE2E })

      if (applyRes.status === SyncStatus.SUCCESS) {
        clearConfigSyncSession()
      } else {
        // Keep conflict session so the user can retry.
        configSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.CONFLICT
      }

      const localized = localizeConfigSyncResult(applyRes.status, applyRes.message)
      const runStatus = applyRes.status === SyncStatus.SUCCESS
        ? IPicGoCloudConfigSyncRunStatus.SUCCESS
        : applyRes.status === SyncStatus.CONFLICT
          ? IPicGoCloudConfigSyncRunStatus.CONFLICT
          : IPicGoCloudConfigSyncRunStatus.FAILED

      const runRes: IPicGoCloudConfigSyncRunResult = {
        status: runStatus,
        message: localized.message,
        toastType: localized.toastType,
        shouldShowRestartPrompt: applyRes.status === SyncStatus.SUCCESS,
        state: await buildConfigSyncState({ consumeNotifyOnce: true })
      }
      return ok(runRes)
    } catch (e) {
      // Keep the conflict session so user can retry from UI.
      configSyncSessionStatus = IPicGoCloudConfigSyncSessionStatus.CONFLICT
      const localized = localizeConfigSyncResult(SyncStatus.FAILED, e instanceof Error ? e.message : String(e))
      const runRes: IPicGoCloudConfigSyncRunResult = {
        status: IPicGoCloudConfigSyncRunStatus.FAILED,
        message: localized.message,
        toastType: localized.toastType,
        state: await buildConfigSyncState()
      }
      return ok(runRes)
    }
  })

export {
  cloudRouter
}
