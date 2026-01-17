export enum IPicGoCloudConfigSyncSessionStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  CONFLICT = 'CONFLICT'
}

export enum IPicGoCloudConfigSyncRunStatus {
  SUCCESS = 'success',
  CONFLICT = 'conflict',
  FAILED = 'failed'
}

export enum IPicGoCloudConfigSyncConflictChoice {
  LOCAL = 'LOCAL',
  CLOUD = 'CLOUD'
}

export enum IPicGoCloudConfigSyncToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum IPicGoCloudEncryptionMode {
  /**
   * AUTO means "follow remote state". It corresponds to `settings.picgoCloud.enableE2E` being `undefined`.
   */
  AUTO = 'AUTO',
  /**
   * SERVER_SIDE corresponds to `settings.picgoCloud.enableE2E` being `false`.
   */
  SERVER_SIDE = 'SERVER_SIDE',
  /**
   * E2E corresponds to `settings.picgoCloud.enableE2E` being `true`.
   */
  E2E = 'E2E'
}

export interface IPicGoCloudConfigSyncConflictItem {
  path: string
  localValue: unknown
  remoteValue: unknown
}

export type IPicGoCloudConfigSyncResolution = Record<string, IPicGoCloudConfigSyncConflictChoice>

export interface IPicGoCloudConfigSyncState {
  sessionStatus: IPicGoCloudConfigSyncSessionStatus
  enableE2E: boolean | undefined
  /**
   * `updatedAt` in `config.snapshot.json` under `baseDir` (ISO string).
   * Used to display "last sync time" in the GUI.
   */
  lastSyncedAt?: string
  conflicts?: IPicGoCloudConfigSyncConflictItem[]
  /**
   * When true, renderer SHOULD show a one-time info toast to tell the user
   * that the remote config is E2E encrypted and the local preference was auto-enabled.
   */
  notifyRemoteE2EOnce?: boolean
}

export interface IPicGoCloudConfigSyncRunResult {
  status: IPicGoCloudConfigSyncRunStatus
  message: string
  toastType: IPicGoCloudConfigSyncToastType
  state: IPicGoCloudConfigSyncState
  /**
   * When true, renderer SHOULD refresh auth state (treat as logged-out).
   */
  authInvalidated?: boolean
  /**
   * When true, renderer SHOULD show a restart prompt after the flow succeeds.
   */
  shouldShowRestartPrompt?: boolean
}
