import { useEffect, useRef, type MouseEvent } from "react"
import DOMPurify from "dompurify"
import { marked } from "marked"
import Prism from "prismjs"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-diff"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-json"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-markdown"
import "prismjs/components/prism-powershell"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-yaml"
import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"
import { openUrl } from "@/lib/utils"
import {
  pluginReadmeStatus,
  type PluginDetailSelectedItem,
  type PluginReadmeState,
} from "./types"

interface PluginDetailReadmeTabContentProps {
  selectedItem: PluginDetailSelectedItem | null
  readmeState: PluginReadmeState | null
}

function renderSanitizedMarkdown(markdown: string) {
  const parsed = marked.parse(markdown)
  const html = typeof parsed === "string" ? parsed : markdown
  return DOMPurify.sanitize(html)
}

function resolveLeadingIndentSize(line: string) {
  return line.match(/^[ \t]*/)?.[0].length ?? 0
}

function normalizeCodeBlockFirstLineSpacing(codeText: string) {
  const normalizedText = codeText.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "")
  const lines = normalizedText.split("\n")
  const firstLineIndex = lines.findIndex((line) => line.trim().length > 0)

  if (firstLineIndex < 0) {
    return normalizedText
  }

  const nextLine = lines
    .slice(firstLineIndex + 1)
    .find((line) => line.trim().length > 0)

  if (!nextLine) {
    return normalizedText
  }

  const firstLine = lines[firstLineIndex] ?? ""
  const firstIndentSize = resolveLeadingIndentSize(firstLine)
  const nextIndentSize = resolveLeadingIndentSize(nextLine)

  if (firstIndentSize === nextIndentSize + 1) {
    lines[firstLineIndex] = firstLine.slice(1)
  }

  return lines.join("\n")
}

export function PluginDetailReadmeTabContent({
  selectedItem,
  readmeState,
}: PluginDetailReadmeTabContentProps) {
  const { t } = useTranslation()
  const articleRef = useRef<HTMLElement | null>(null)

  // Post-process rendered markdown (spacing, grouped links, syntax highlighting) when README is ready.
  useEffect(() => {
    if (readmeState?.status !== pluginReadmeStatus.Ready) {
      return
    }

    const articleElement = articleRef.current

    if (!articleElement) {
      return
    }

    const codeElements = articleElement.querySelectorAll("pre code")

    codeElements.forEach((codeElement) => {
      const source = codeElement.textContent ?? ""
      const normalized = normalizeCodeBlockFirstLineSpacing(source)

      if (normalized !== source) {
        codeElement.textContent = normalized
      }
    })

    const paragraphElements = articleElement.querySelectorAll("p")

    paragraphElements.forEach((paragraphElement) => {
      if (paragraphElement.querySelectorAll("a").length > 1) {
        paragraphElement.classList.add("app-plugin-readme-link-group")
      }
    })

    Prism.highlightAllUnder(articleElement)
  }, [readmeState?.content, readmeState?.status])

  const handleReadmeLinkClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const anchor = target.closest("a[href]")

    if (!(anchor instanceof HTMLAnchorElement)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    openUrl(anchor.href).catch(() => undefined)
  }

  if (!selectedItem) {
    return null
  }

  return (
    <div className="space-y-4">
      {readmeState?.status === pluginReadmeStatus.Loading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : null}

      {readmeState?.status === pluginReadmeStatus.Error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm">
          <div className="text-destructive font-medium">{t("FAILED")}</div>
          <p className="text-muted-foreground mt-1">
            {readmeState.errorMessage ?? t("TIPS_GET_PLUGIN_LIST_FAILED")}
          </p>
        </div>
      ) : null}

      {readmeState?.status === pluginReadmeStatus.Empty ? (
        <div className="text-muted-foreground rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm">
          {t("PLUGIN_NO_README")}
        </div>
      ) : null}

      {readmeState?.status === pluginReadmeStatus.Ready ? (
        <article
          ref={articleRef}
          className="app-plugin-readme prose prose-sm max-w-none prose-a:no-underline prose-a:transition-colors hover:prose-a:text-(--app-plugin-tab-active-color) hover:prose-a:underline prose-code:rounded-md prose-code:bg-(--app-plugin-readme-inline-code-bg) prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-lg prose-pre:border prose-pre:border-(--app-plugin-readme-pre-border) prose-pre:bg-(--app-plugin-readme-pre-bg) prose-blockquote:text-muted-foreground prose-img:rounded-lg [&_pre]:overflow-x-auto"
          onClick={handleReadmeLinkClick}
          dangerouslySetInnerHTML={{
            __html: renderSanitizedMarkdown(readmeState.content),
          }}
        />
      ) : null}
    </div>
  )
}
