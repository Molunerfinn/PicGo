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

export type IPicGoCloudUsageDimension = {
  used: number
  limit: number | null
}

export type IPicGoCloudUsagePeriodInfo = {
  used: number
  periodStart: string | null
  periodEnd: string | null
}

export type IPicGoCloudUsageConfigHistory = {
  used: number
  limit: number
  appType: 'gui' | 'cli'
}

export type IPicGoCloudUsage = {
  plan: string
  storage: IPicGoCloudUsageDimension
  mediaCount: IPicGoCloudUsageDimension
  monthlyServes: IPicGoCloudUsagePeriodInfo
  configHistory: IPicGoCloudUsageConfigHistory
}

export enum IPicGoCloudErrorCode {
  LOGIN_TIMEOUT = 'PICGO_CLOUD_LOGIN_TIMEOUT',
  LOGIN_FAILED = 'PICGO_CLOUD_LOGIN_FAILED'
}
