export function resolveIndependentWindowErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    const message = error.message.trim()
    return message.length > 0 ? message : fallback
  }

  return fallback
}

export async function copyToClipboard(value: string) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable.")
  }

  await navigator.clipboard.writeText(value)
}
