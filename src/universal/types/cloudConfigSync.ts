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

export enum IPicGoCloudEncryptionMethod {
  /**
   * AUTO means "follow remote state". It corresponds to `settings.picgoCloud.encryptionMethod` being `auto` or missing.
   */
  AUTO = 'auto',
  /**
   * Server side encryption.
   * SSE corresponds to `settings.picgoCloud.encryptionMethod` being `sse`.
   */
  SSE = 'sse',
  /**
   * End-to-end encryption.
   * E2EE corresponds to `settings.picgoCloud.encryptionMethod` being `e2ee`.
   */
  E2EE = 'e2ee'
}

export interface IPicGoCloudConfigSyncConflictItem {
  path: string
  localValue: unknown
  remoteValue: unknown
}

export type IPicGoCloudConfigSyncResolution = Record<string, IPicGoCloudConfigSyncConflictChoice>

export interface IPicGoCloudConfigSyncState {
  sessionStatus: IPicGoCloudConfigSyncSessionStatus
  encryptionMethod?: IPicGoCloudEncryptionMethod
  /**
   * `updatedAt` in `config.snapshot.json` under `baseDir` (ISO string).
   * Used to display "last sync time" in the GUI.
   */
  lastSyncedAt?: string
  conflicts?: IPicGoCloudConfigSyncConflictItem[]
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
