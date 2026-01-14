import { randomUUID } from 'node:crypto'

export type UploadResponseBody = {
  success: boolean
  result: string[]
  message?: string
}

export type HonoContextLike = {
  req: {
    raw: Request
    formData: () => Promise<FormData>
  }
  json: (data: unknown, status?: number) => Response
}

type FormDataFileLike = {
  name?: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

export const isFileLike = (value: unknown): value is FormDataFileLike => {
  if (typeof value !== 'object' || value === null) return false
  if (!('arrayBuffer' in value)) return false
  return typeof (value as { arrayBuffer?: unknown }).arrayBuffer === 'function'
}

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export const buildSuccess = (result: string[]): UploadResponseBody => ({
  success: true,
  result
})

export const buildError = (message: string): UploadResponseBody => ({
  success: false,
  result: [],
  message
})

export const getFormDataFileName = (value: FormDataFileLike): string => {
  const name = value.name
  if (typeof name === 'string' && name.trim() !== '') return name
  return `${randomUUID()}.png`
}

