import * as React from "react"
import { Slot } from "@/lib/slot"

export function getAsChildRender(
  asChild: boolean | undefined,
  children: React.ReactNode
) {
  if (!asChild) {
    return undefined
  }

  return <Slot>{children}</Slot>
}

export function getAsChildChildren(
  asChild: boolean | undefined,
  children: React.ReactNode
) {
  return asChild ? undefined : children
}
