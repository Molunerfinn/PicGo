import * as React from 'react'

export function useComboboxAnchor () {
  return React.useRef<HTMLDivElement | null>(null)
}
