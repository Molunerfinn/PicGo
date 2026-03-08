import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function openFile(filePath: string) {
  // TODO: replace browser fallback with Electron IPC file opener.
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(`file://${filePath}`, "_blank", "noopener,noreferrer")
  }
}

export async function openUrl(url: string) {
  // TODO: replace browser fallback with Electron IPC external opener.
  if (typeof window !== "undefined" && typeof window.open === "function") {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}
