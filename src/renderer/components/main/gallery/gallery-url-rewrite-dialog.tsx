import { HelpCircle } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { getGalleryImageUrl, type GalleryPhoto } from "./utils"

type GalleryUrlRewriteChange = {
  id: number
  nextSrc: string
  originImgUrl?: string
}

type GalleryUrlRewriteDialogProps = {
  selectedImages: GalleryPhoto[]
  onApply: (changes: GalleryUrlRewriteChange[]) => void
}

type UrlRewriteRule = {
  match: string
  replace: string
  global: boolean
  ignoreCase: boolean
}

function buildFlags(rule: Pick<UrlRewriteRule, "global" | "ignoreCase">) {
  return `${rule.global ? "g" : ""}${rule.ignoreCase ? "i" : ""}`
}

function compileRegex(rule: UrlRewriteRule) {
  return new RegExp(rule.match, buildFlags(rule))
}

export function GalleryUrlRewriteDialog({
  selectedImages,
  onApply,
}: GalleryUrlRewriteDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [matchValue, setMatchValue] = useState("")
  const [replaceValue, setReplaceValue] = useState("")
  const [applyGlobalRules, setApplyGlobalRules] = useState(false)
  const [isGlobal, setIsGlobal] = useState(false)
  const [isIgnoreCase, setIsIgnoreCase] = useState(false)

  const resetForm = () => {
    setMatchValue("")
    setReplaceValue("")
    setApplyGlobalRules(false)
    setIsGlobal(false)
    setIsIgnoreCase(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleApply = () => {
    if (selectedImages.length === 0) return

    const match = matchValue.trim()
    const replace = replaceValue.trim()

    if (!match || !replace) {
      toast.error(t("GALLERY_URL_REWRITE_TEMP_RULE_REQUIRED"))
      return
    }

    const rule: UrlRewriteRule = {
      match,
      replace,
      global: isGlobal,
      ignoreCase: isIgnoreCase,
    }

    let regex: RegExp
    try {
      regex = compileRegex(rule)
    } catch {
      toast.error(t("URL_REWRITE_INVALID_REGEX"))
      return
    }

    const changes: GalleryUrlRewriteChange[] = []
    let hasEmptyResult = false

    selectedImages.forEach((image) => {
      const currentUrl = getGalleryImageUrl(image)
      if (!currentUrl) return

      const scopedRegex = new RegExp(regex.source, regex.flags)
      const nextUrl = currentUrl.replace(scopedRegex, rule.replace)
      if (nextUrl === currentUrl) return
      if (nextUrl === "") {
        hasEmptyResult = true
        return
      }

      changes.push({
        id: image.id,
        nextSrc: nextUrl,
        originImgUrl: image.originImgUrl ?? currentUrl,
      })
    })

    if (hasEmptyResult) {
      toast(t("GALLERY_URL_REWRITE_EMPTY_RESULT_WARN"))
    }

    if (changes.length === 0) {
      toast(t("GALLERY_URL_REWRITE_NO_CHANGES"))
      return
    }

    onApply(changes)

    const unchanged = selectedImages.length - changes.length
    toast.success(t("GALLERY_URL_REWRITE_RESULT_TITLE"), {
      description: `${t("GALLERY_URL_REWRITE_CHANGED")}: ${changes.length} ${t(
        "GALLERY_URL_REWRITE_UNCHANGED"
      )}: ${unchanged}`,
    })

    setOpen(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {t("GALLERY_BATCH_REWRITE")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(620px,80vh)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle>{t("GALLERY_URL_REWRITE_TITLE")}</DialogTitle>
          <DialogDescription>{t("GALLERY_URL_REWRITE_DESCRIPTION")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-6 py-4">
            <Label
              htmlFor="gallery-url-rewrite-apply-global"
              className="gap-3 rounded-lg border border-border/70 p-3"
            >
              <Checkbox
                id="gallery-url-rewrite-apply-global"
                checked={applyGlobalRules}
                onCheckedChange={(checked) => setApplyGlobalRules(checked === true)}
              />
              <span className="text-sm font-medium">
                {t("GALLERY_URL_REWRITE_APPLY_GLOBAL_RULES")}
              </span>
            </Label>

            <div className="space-y-2">
              <Label
                htmlFor="gallery-url-rewrite-match"
                className="flex items-center gap-2"
              >
                {t("URL_REWRITE_MATCH")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground inline-flex"
                      aria-label={t("GALLERY_URL_REWRITE_TEMP_RULE_TIPS")}
                    >
                      <HelpCircle className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    {t("GALLERY_URL_REWRITE_TEMP_RULE_TIPS")}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="gallery-url-rewrite-match"
                value={matchValue}
                onChange={(event) => setMatchValue(event.target.value)}
                placeholder={t("URL_REWRITE_MATCH_PLACEHOLDER")}
              />
              <p className="text-muted-foreground text-xs">
                {t("URL_REWRITE_MATCH_TIPS")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-url-rewrite-replace">
                {t("URL_REWRITE_REPLACE")}
              </Label>
              <Input
                id="gallery-url-rewrite-replace"
                value={replaceValue}
                onChange={(event) => setReplaceValue(event.target.value)}
                placeholder={t("URL_REWRITE_REPLACE_PLACEHOLDER")}
              />
              <p className="text-muted-foreground text-xs">
                {t("URL_REWRITE_REPLACE_TIPS")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {t("URL_REWRITE_OPTIONS")}
              </div>
              <div className="grid gap-3">
                <Label
                  htmlFor="gallery-url-rewrite-global"
                  className="gap-3 rounded-lg border border-border/70 p-3"
                >
                  <Checkbox
                    id="gallery-url-rewrite-global"
                    checked={isGlobal}
                    onCheckedChange={(checked) => setIsGlobal(checked === true)}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {t("URL_REWRITE_FLAG_GLOBAL_LABEL")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("URL_REWRITE_FLAG_GLOBAL_DESC")}
                    </span>
                  </span>
                </Label>
                <Label
                  htmlFor="gallery-url-rewrite-ignore-case"
                  className="gap-3 rounded-lg border border-border/70 p-3"
                >
                  <Checkbox
                    id="gallery-url-rewrite-ignore-case"
                    checked={isIgnoreCase}
                    onCheckedChange={(checked) => setIsIgnoreCase(checked === true)}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {t("URL_REWRITE_FLAG_IGNORE_CASE_LABEL")}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("URL_REWRITE_FLAG_IGNORE_CASE_DESC")}
                    </span>
                  </span>
                </Label>
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="border-border sticky bottom-0 border-t bg-background px-6 py-4">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            {t("CANCEL")}
          </Button>
          <Button type="button" onClick={handleApply}>
            {t("GALLERY_URL_REWRITE_APPLY_ONLY")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { GalleryUrlRewriteChange }
