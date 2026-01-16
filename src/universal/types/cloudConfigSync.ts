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
