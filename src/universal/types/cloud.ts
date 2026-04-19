export interface IPicGoCloudUserInfo {
  user: string | null
  avatar?: string | null
  plan?: number
  autoImport?: boolean
}

export enum IPicGoCloudErrorCode {
  LOGIN_TIMEOUT = 'PICGO_CLOUD_LOGIN_TIMEOUT',
  LOGIN_FAILED = 'PICGO_CLOUD_LOGIN_FAILED'
}
