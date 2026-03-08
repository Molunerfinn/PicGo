import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { parseShortcutKeys } from './utils'
import { ShortcutKbdList } from './shortcut-kbd-list'

interface ShortcutEditDialogProps {
  open: boolean
  draftShortcutValue: string
  isCaptureActive: boolean
  onCancel: () => void
  onConfirm: () => void
  onCaptureActivate: () => void
  onCaptureBlur: () => void
  onCaptureKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void
}

export function ShortcutEditDialog({
  open,
  draftShortcutValue,
  isCaptureActive,
  onCancel,
  onConfirm,
  onCaptureActivate,
  onCaptureBlur,
  onCaptureKeyDown,
}: ShortcutEditDialogProps) {
  const { t } = useTranslation()
  const captureRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    captureRef.current?.focus()
  }, [open])

  const handleCaptureClick = () => {
    onCaptureActivate()
    captureRef.current?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('SETTINGS_SET_SHORTCUT')}</DialogTitle>
          <DialogDescription>{t('SHORTCUT_BIND')}</DialogDescription>
        </DialogHeader>

        <div>
          <button
            ref={captureRef}
            type="button"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-22 w-full flex-wrap items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-center text-sm outline-none focus-visible:ring-2"
            onClick={handleCaptureClick}
            onKeyDown={onCaptureKeyDown}
            onBlur={onCaptureBlur}
          >
            {isCaptureActive && parseShortcutKeys(draftShortcutValue).length === 0 ? (
              <span
                className="bg-foreground caret-blink h-5 w-0.5 rounded-full"
                aria-hidden="true"
              />
            ) : (
              <ShortcutKbdList value={draftShortcutValue} compactModifiers={true} />
            )}
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('CANCEL')}
          </Button>
          <Button onClick={onConfirm}>{t('CONFIRM')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
