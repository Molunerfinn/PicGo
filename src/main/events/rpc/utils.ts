const errorToMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message
  return String(e)
}

export const ok = <T>(data: T): IRPCResult<T> => ({
  success: true,
  data
})

export const fail = <T>(e: unknown): IRPCResult<T> => ({
  success: false,
  error: errorToMessage(e)
})

export const isIRPCResult = (value: unknown): value is IRPCResult<any> => {
  if (!value || typeof value !== 'object') return false
  const maybe = value as { success?: unknown, data?: unknown, error?: unknown }
  if (typeof maybe.success !== 'boolean') return false

  // success=true MUST have data; success=false MUST have error.
  if (maybe.success) return 'data' in maybe
  return typeof maybe.error === 'string'
}

