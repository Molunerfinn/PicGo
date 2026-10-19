import { ChevronRightIcon, InfoIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { IPicGoCloudBillingOverview } from '#/types/cloud'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  PLAN_PERIOD_PLACEHOLDER,
  PlanPeriodBadgeTone,
  resolvePlanPeriodBlocks,
  resolvePlanPeriodLabelInfo,
  resolvePlanPeriodTooltip,
  type PlanPeriodBlock,
  type PlanPeriodChainItem,
  type PlanPeriodTooltip
} from './cloud-plan-usage-helpers'

interface PlanPeriodRowProps {
  billing: IPicGoCloudBillingOverview | null
  isLoading: boolean
}

const WARNING_TEXT_CLASS = 'text-amber-600 dark:text-amber-400'

const BADGE_TONE_CLASS: Record<PlanPeriodBadgeTone, string> = {
  [PlanPeriodBadgeTone.Neutral]: 'border-border bg-muted text-foreground',
  [PlanPeriodBadgeTone.Warning]: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
}

export function PlanPeriodRow ({ billing, isLoading }: PlanPeriodRowProps) {
  const { t } = useTranslation()
  const blocks = resolvePlanPeriodBlocks(billing, t)
  const { labelKey, tooltipKey } = resolvePlanPeriodLabelInfo(billing)
  const tooltipText = tooltipKey ? t(tooltipKey) : null
  // Grace / frozen keeps its plain text explanation; otherwise fall back to the rich timeline tooltip when it has anything to show.
  const richTooltip = tooltipText ? null : resolvePlanPeriodTooltip(billing, t)
  const hasRichTooltip = (richTooltip?.timeline.length ?? 0) > 0 || (richTooltip?.notes.length ?? 0) > 0

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="flex shrink-0 items-center gap-1.5 font-medium text-foreground">
        {t(labelKey)}
        {tooltipText
          ? (
            <PlanPeriodInfoTooltip>
              <p className="max-w-64 text-xs leading-relaxed">{tooltipText}</p>
            </PlanPeriodInfoTooltip>
          )
          : null}
        {richTooltip && hasRichTooltip
          ? (
            <PlanPeriodInfoTooltip>
              <PlanPeriodTooltipBody tooltip={richTooltip} />
            </PlanPeriodInfoTooltip>
          )
          : null}
      </span>
      <div className="flex min-w-0 flex-col items-end gap-2 text-right">
        {renderPlanPeriodBlocks(blocks, isLoading)}
      </div>
    </div>
  )
}

function PlanPeriodInfoTooltip ({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <InfoIcon
          data-testid="plan-period-info"
          className="text-muted-foreground hover:text-foreground size-3.5 cursor-help transition-colors"
        />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}

function PlanPeriodTooltipBody ({ tooltip }: { tooltip: PlanPeriodTooltip }) {
  const { timeline, notes } = tooltip
  return (
    <div className="flex max-w-72 flex-col gap-2 py-0.5 text-xs leading-relaxed">
      {timeline.length > 0
        ? (
          <div className="grid grid-cols-[auto_auto_auto] gap-x-2 gap-y-0.5 tabular-nums">
            {timeline.map((item, index) => (
              <div key={`${item.plan}-${item.range}-${index}`} data-testid="plan-period-timeline-row" className="contents">
                <span className="text-background/60">{item.tag}</span>
                <span className="font-medium">{item.plan}</span>
                <span>{item.range}</span>
              </div>
            ))}
          </div>
        )
        : null}
      {notes.length > 0
        ? (
          <div className={cn('flex flex-col gap-1 text-background/70', timeline.length > 0 && 'border-t border-background/20 pt-2')}>
            {notes.map((note, index) => (
              <p key={`${note}-${index}`}>{note}</p>
            ))}
          </div>
        )
        : null}
    </div>
  )
}

function renderPlanPeriodBlocks (blocks: PlanPeriodBlock[], isLoading: boolean) {
  if (isLoading) return <Skeleton className="h-4 w-24" />
  if (blocks.length === 0) return <span className="text-muted-foreground">{PLAN_PERIOD_PLACEHOLDER}</span>
  return blocks.map((block, index) => (
    <PlanPeriodBlockView key={`${block.primary ?? ''}-${block.secondary}-${index}`} block={block} />
  ))
}

// The server merges back-to-back segments of the same plan and orders them by rank, so today the chain holds at most one entry per paid plan. Cap it anyway so a future longer chain stays on one line; the tooltip always lists every segment with dates.
const PLAN_PERIOD_CHAIN_MAX_ITEMS = 3

/** Keeps the first items and replaces the rest with a single ellipsis entry (null). */
function truncateChain (chain: PlanPeriodChainItem[]): Array<PlanPeriodChainItem | null> {
  if (chain.length <= PLAN_PERIOD_CHAIN_MAX_ITEMS) return chain
  return [...chain.slice(0, PLAN_PERIOD_CHAIN_MAX_ITEMS - 1), null]
}

// Each line keeps its words together and only wraps between whole pieces (label / badge / plan), so a narrow card never breaks a phrase like "Expiring soon" in the middle.
function PlanPeriodBlockView ({ block }: { block: PlanPeriodBlock }) {
  const secondaryClass = cn('text-muted-foreground/70 text-xs', block.warning && WARNING_TEXT_CLASS)
  return (
    <div data-testid="plan-period-block" className="flex flex-col items-end gap-0.5">
      {block.primary
        ? (
          <>
            <span className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5">
              <span className="text-muted-foreground whitespace-nowrap">{block.primary}</span>
              {block.badges.map((badge) => (
                <Badge
                  key={badge.label}
                  data-testid="plan-period-badge"
                  data-tone={badge.tone}
                  className={cn('h-auto px-1.5 py-0 text-[11px]', BADGE_TONE_CLASS[badge.tone])}
                >
                  {badge.label}
                </Badge>
              ))}
            </span>
            <span className={secondaryClass}>{block.secondary}</span>
          </>
        )
        : <span className="text-muted-foreground">{block.secondary}</span>}
      {block.chain.length > 0
        ? (
          <span data-testid="plan-period-chain" className="text-muted-foreground/70 flex flex-wrap items-center justify-end gap-x-1 text-xs">
            {truncateChain(block.chain).map((item, index) => (
              <span key={`${item?.plan ?? 'more'}-${index}`} className="flex items-center gap-x-1 whitespace-nowrap">
                {index > 0 ? <ChevronRightIcon aria-hidden className="size-3 opacity-60" /> : null}
                {item
                  ? <span className={cn(item.current && 'text-foreground font-medium')}>{item.plan}</span>
                  : <span data-testid="plan-period-chain-more">…</span>}
              </span>
            ))}
          </span>
        )
        : null}
    </div>
  )
}
