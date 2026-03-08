import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  providerConfigNameActionMode,
  type ProviderConfigNameDialogState,
} from "./hooks/use-provider-config-name-dialog"

interface ProviderConfigNameDialogProps {
  state: ProviderConfigNameDialogState | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onSubmit: () => Promise<void>
}

export function ProviderConfigNameDialog({
  state,
  isSubmitting,
  onOpenChange,
  onNameChange,
  onSubmit,
}: ProviderConfigNameDialogProps) {
  const { t } = useTranslation()

  let dialogTitle = ""

  if (state?.mode === providerConfigNameActionMode.Create) {
    dialogTitle = t("PROVIDER_CREATE_CONFIG")
  } else if (state?.mode === providerConfigNameActionMode.Rename) {
    dialogTitle = t("CONFIG_RENAME")
  } else if (state?.mode === providerConfigNameActionMode.Copy) {
    dialogTitle = t("COPY_PICBED_CONFIG")
  }

  const handleSubmit = () => {
    onSubmit().catch(() => {
      // The submit handler already reports failures via toast.
    })
  }

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {t("UPLOADER_CONFIG_NAME")}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={state?.name ?? ""}
          placeholder={t("UPLOADER_CONFIG_PLACEHOLDER")}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleSubmit()
            }
          }}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("CANCEL")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {t("CONFIRM")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
