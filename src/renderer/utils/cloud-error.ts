import type { TFunction } from 'i18next'
import type { IPicGoCloudLifecyclePhase } from '#/types/cloud'

/**
 * picgo-hub 返回的与 lifecycle / 配额 / 套餐相关的错误码。值跟 picgo-hub
 * `@picgo/shared` 的 ApiErrorCode 对齐。
 */
const CLOUD_ERROR_CODES = {
  GraceRestricted: 'GRACE_RESTRICTED',
  AccountFrozen: 'ACCOUNT_FROZEN',
  ImportDisabled: 'IMPORT_DISABLED',
  PlanIneligible: 'PLAN_INELIGIBLE',
  PlanRequired: 'PLAN_REQUIRED',
  QuotaExceeded: 'QUOTA_EXCEEDED'
} as const

/**
 * 把 RPC 失败结果（带 code）+ 当前 lifecycle phase 映射为本地化 toast 文案。
 * 命中已知 lifecycle 错误码时返回对应翻译；否则回 fallback（一般是原始 error.message
 * 或调用方提供的通用文案，比如 OPERATION_FAILED）。
 */
export function resolveCloudErrorMessage (
  t: TFunction,
  errorCode: string | undefined | null,
  phase: IPicGoCloudLifecyclePhase | undefined | null,
  fallback: string
): string {
  switch (errorCode) {
    case CLOUD_ERROR_CODES.GraceRestricted:
      return t('PICGO_CLOUD_ERROR_GRACE_RESTRICTED')
    case CLOUD_ERROR_CODES.AccountFrozen:
      return t('PICGO_CLOUD_ERROR_ACCOUNT_FROZEN')
    case CLOUD_ERROR_CODES.ImportDisabled:
      return t('PICGO_CLOUD_ERROR_IMPORT_DISABLED')
    case CLOUD_ERROR_CODES.PlanIneligible:
      return t('PICGO_CLOUD_ERROR_PLAN_INELIGIBLE')
    case CLOUD_ERROR_CODES.PlanRequired:
      return t('PICGO_CLOUD_ERROR_PLAN_REQUIRED')
    case CLOUD_ERROR_CODES.QuotaExceeded:
      // QUOTA_EXCEEDED 在不同 phase 下指向不同行动：active 升级，grace 续费
      if (phase === 'grace' || phase === 'frozen' || phase === 'pending_cleanup') {
        return t('PICGO_CLOUD_ERROR_QUOTA_EXCEEDED_GRACE')
      }
      return t('PICGO_CLOUD_ERROR_QUOTA_EXCEEDED_ACTIVE')
    default:
      return fallback
  }
}
