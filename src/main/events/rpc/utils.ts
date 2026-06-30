import logger from '@core/picgo/logger'
const errorToMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message
  return String(e)
}

/**
 * 从抛出的 error 里提取错误码字符串。两个字段都查，优先级：apiCode > code。
 *
 * - apiCode：picgo-core `createCloudServiceError` 包装后挂上的业务错误码字段，
 *   值来自后端响应体里的 `data.code`（如 'ACCOUNT_FROZEN' / 'QUOTA_EXCEEDED'）。
 *   走过 picgo-core 包装的云端调用，错误码都在这里。
 *
 * - code：兜底字段，覆盖两种场景：
 *   1) axios 底层错误自带的 `code`（如 'ECONNREFUSED' / 'ETIMEDOUT'），未被
 *      picgo-core 包装就穿透到这里时，错误码仅存在于 `code`；
 *   2) 其他非 picgo-core 抛出的自定义错误对象用 `code` 字段。
 *
 * 防御性保留两者，避免因调用路径不一致丢失错误码。
 */
const errorToCode = (e: unknown): string | undefined => {
  if (!e || typeof e !== 'object') return undefined
  const maybe = e as { apiCode?: unknown, code?: unknown }
  if (typeof maybe.apiCode === 'string') return maybe.apiCode
  if (typeof maybe.code === 'string') return maybe.code
  return undefined
}

export const ok = <T>(data: T): IRPCResult<T> => ({
  success: true,
  data
})

export const fail = <T>(e: unknown): IRPCResult<T> => {
  const code = errorToCode(e)
  const error = errorToMessage(e)
  logger.error(`[RPC][FAIL] code=${code} message=${error}`)
  return {
    success: false,
    error,
    ...(code ? { code } : {})
  }
}

export const isIRPCResult = (value: unknown): value is IRPCResult<any> => {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { success?: unknown, data?: unknown, error?: unknown }
  if (typeof maybe.success !== 'boolean') return false

  // success=true MUST have data; success=false MUST have error.
  if (maybe.success) return 'data' in maybe
  return typeof maybe.error === 'string'
}
