import type { ValueOf } from "@/types/utils"

export const NAV_TAB = {
  DASHBOARD: "dashboard",
  GALLERY: "gallery",
  HOST: "host",
  PLUGINS: "plugins",
  SETTINGS: "settings",
  NOTIFICATIONS: "notifications",
} as const

export type NavTab = ValueOf<typeof NAV_TAB>

export const LINK_FORMAT = {
  MARKDOWN: "Markdown",
  HTML: "HTML",
  URL: "URL",
  UBB: "UBB",
  CUSTOM: "Custom",
} as const

export type LinkFormat = ValueOf<typeof LINK_FORMAT>

export const RECENT_UPLOAD_TYPE = {
  IMAGE: "image",
  FILE: "file",
} as const

export type RecentUploadType =
  ValueOf<typeof RECENT_UPLOAD_TYPE>

export type RecentUpload = {
  id: number | string
  name: string
  time: string
  type: RecentUploadType
  subtitle?: string
  thumbnailUrl?: string
}
