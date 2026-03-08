import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProviderDeleteConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function ProviderDeleteConfigDialog({
  open,
  onOpenChange,
  onConfirm,
}: ProviderDeleteConfigDialogProps) {
  const { t } = useTranslation()

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>{t("TIPS_NOTICE")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("TIPS_DELETE_UPLOADER_CONFIG")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("CANCEL")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            {t("CONFIRM")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
