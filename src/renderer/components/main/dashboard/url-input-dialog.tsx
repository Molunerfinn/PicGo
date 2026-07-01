import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { parseNewlineSeparatedUrls } from '#/utils/common'
import { dashboardAdapter } from '@/adapters/dashboard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface UrlInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue: string
  onSubmit: (urls: string[], invalidLines: string[]) => Promise<boolean>
}

export function UrlInputDialog ({ open, onOpenChange, initialValue, onSubmit }: UrlInputDialogProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue)

  const handleOpenChange = (next: boolean) => {
    if (next) setValue(initialValue)
    onOpenChange(next)
  }

  const handleSubmit = async () => {
    if (!value.trim()) return
    const { urls, invalidLines } = parseNewlineSeparatedUrls(value, { source: 'plain' })
    if (!urls.length) {
      if (invalidLines.length > 0) {
        dashboardAdapter.logInvalidUrlLines(invalidLines)
        toast.error(t('TIPS_SKIPPED_INVALID_URLS', { n: invalidLines.length }))
        return
      }
      toast.error(t('TIPS_NO_VALID_URLS'))
      return
    }
    const didStart = await onSubmit(urls, invalidLines)
    if (didStart) {
      onOpenChange(false)
      setValue('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('TIPS_INPUT_URL')}</DialogTitle>
        </DialogHeader>
        <Textarea
          className="min-h-36 resize-y"
          placeholder={t('TIPS_HTTP_PREFIX')}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('CANCEL')}
          </Button>
          <Button onClick={() => { handleSubmit().catch(console.error) }}>
            {t('CONFIRM')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

