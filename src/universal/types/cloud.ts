export enum UserPlanLevel {
  Free = 0,
  Starter = 1,
  Pro = 2,
  Max = 3,
}

export interface IPicGoCloudUserInfo {
  user: string | null
  avatar?: string | null
  plan?: UserPlanLevel
  autoImport?: boolean
}

export enum IPicGoCloudErrorCode {
  LOGIN_TIMEOUT = 'PICGO_CLOUD_LOGIN_TIMEOUT',
  LOGIN_FAILED = 'PICGO_CLOUD_LOGIN_FAILED'
}
