import { Kbd } from '@/components/ui/kbd'

import { formatShortcutValueForDisplay } from './shortcut-key-binding'

function formatDialogShortcutToken(key: string) {
  if (key === 'Command') {
    return 'Cmd'
  }

  if (key === 'CommandOrCtrl') {
    return 'CmdOrCtrl'
  }

  return key
}

interface ShortcutKbdListProps {
  value: string
  compactModifiers?: boolean
}

export function ShortcutKbdList({
  value,
  compactModifiers = false,
}: ShortcutKbdListProps) {
  const keys = formatShortcutValueForDisplay(value).slice(0, 4)

  if (keys.length === 0) {
    return <span className="text-muted-foreground text-sm">--</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {keys.map((key, index) => (
        <div key={`${value}-${key}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-muted-foreground text-xs">+</span> : null}
          <Kbd>{compactModifiers ? formatDialogShortcutToken(key) : key}</Kbd>
        </div>
      ))}
    </div>
  )
}
