import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LoaderCircleIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type GalleryDeleteDialogProps = {
  trigger: React.ReactNode
  selectedCount: number
  onConfirm: () => Promise<void>
}

export function GalleryDeleteDialog ({ trigger, selectedCount, onConfirm }: GalleryDeleteDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      toast.success(t("OPERATION_SUCCEED"))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }


  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DELETE")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("TIPS_WILL_REMOVE_CHOOSED_IMAGES", { m: selectedCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("CANCEL")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={(event) => {
              event.preventDefault()
              const confirmPromise = handleConfirm()
              console.log('confirmPromise', confirmPromise)
              confirmPromise.catch(() => {})
            }}
          >
            {loading ? <LoaderCircleIcon className="mr-1.5 size-4 animate-spin" /> : null}
            {t("DELETE")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
