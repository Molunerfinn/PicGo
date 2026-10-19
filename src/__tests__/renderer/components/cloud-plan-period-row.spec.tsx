// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Base UI tooltips only mount their popup on hover; render the content inline so its markup can be asserted directly.
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>
}))

vi.mock('@/components/main/cloud/cloud-plan-usage-helpers', () => ({
  PLAN_PERIOD_PLACEHOLDER: '-',
  PlanPeriodBadgeTone: { Neutral: 'neutral', Warning: 'warning' },
  resolvePlanPeriodBlocks: vi.fn(),
  resolvePlanPeriodTooltip: vi.fn(),
  resolvePlanPeriodLabelInfo: vi.fn()
}))

import {
  PlanPeriodBadgeTone,
  resolvePlanPeriodBlocks,
  resolvePlanPeriodLabelInfo,
  resolvePlanPeriodTooltip
} from '@/components/main/cloud/cloud-plan-usage-helpers'
import { PlanPeriodRow } from '@/components/main/cloud/cloud-plan-period-row'

const WARNING_CLASS = 'text-amber-600'

describe('PlanPeriodRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolvePlanPeriodLabelInfo).mockReturnValue({ labelKey: 'PICGO_CLOUD_PLAN_PERIOD_LABEL', tooltipKey: null })
    vi.mocked(resolvePlanPeriodTooltip).mockReturnValue(null)
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([])
  })

  it('renders the skeleton while loading', () => {
    const { container } = render(<PlanPeriodRow billing={null} isLoading />)
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    expect(screen.queryByText('-')).toBeNull()
  })

  it('renders the placeholder when there are no blocks and no info icon without tooltip data', () => {
    render(<PlanPeriodRow billing={null} isLoading={false} />)
    expect(screen.getByText('PICGO_CLOUD_PLAN_PERIOD_LABEL')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.queryByTestId('plan-period-block')).toBeNull()
    expect(screen.queryByTestId('plan-period-info')).toBeNull()
  })

  it('renders a single block with primary and secondary lines', () => {
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([
      { primary: 'Yearly', secondary: 'Renews on 2027-06-30', badges: [], chain: [], warning: false }
    ])
    render(<PlanPeriodRow billing={null} isLoading={false} />)

    const blocks = screen.getAllByTestId('plan-period-block')
    expect(blocks).toHaveLength(1)
    const primary = screen.getByText('Yearly')
    const secondary = screen.getByText('Renews on 2027-06-30')
    expect(primary).toHaveClass('text-muted-foreground')
    expect(primary).not.toHaveClass(WARNING_CLASS)
    expect(secondary).toHaveClass('text-xs')
    expect(secondary).not.toHaveClass(WARNING_CLASS)
    expect(screen.queryByText('-')).toBeNull()
  })

  it('renders a block without primary using the primary style for its secondary text', () => {
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([
      { primary: null, secondary: '2026-10-23', badges: [], chain: [], warning: false }
    ])
    render(<PlanPeriodRow billing={null} isLoading={false} />)

    const only = screen.getByText('2026-10-23')
    expect(only).toHaveClass('text-muted-foreground')
    expect(only).not.toHaveClass('text-xs')
  })

  it('stacks multiple blocks with an expiring badge, warning date and plan chain', () => {
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([
      {
        primary: 'Fixed-term membership',
        badges: [{ label: 'Expiring soon', tone: PlanPeriodBadgeTone.Warning }],
        secondary: 'Valid until 2026-10-23 (4 days left)',
        chain: [
          { plan: 'Max', current: true },
          { plan: 'Pro', current: false },
          { plan: 'Starter', current: false }
        ],
        warning: true
      },
      { primary: 'Subscription · Pro', secondary: 'Renews on 2027-06-30', badges: [{ label: 'In use', tone: PlanPeriodBadgeTone.Neutral }], chain: [], warning: false }
    ])
    render(<PlanPeriodRow billing={null} isLoading={false} />)

    const blocks = screen.getAllByTestId('plan-period-block')
    expect(blocks).toHaveLength(2)

    // The label and the badge are separate nowrap pieces, so the phrase never breaks mid-way.
    expect(within(blocks[0]).getByText('Fixed-term membership')).toHaveClass('whitespace-nowrap')
    expect(within(blocks[0]).getByTestId('plan-period-badge')).toHaveTextContent('Expiring soon')
    expect(within(blocks[0]).getByText('Valid until 2026-10-23 (4 days left)')).toHaveClass(WARNING_CLASS)
    const chain = within(blocks[0]).getByTestId('plan-period-chain')
    expect(chain).toHaveTextContent('MaxProStarter')
    expect(within(chain).getByText('Max')).toHaveClass('font-medium')
    expect(within(chain).getByText('Pro')).not.toHaveClass('font-medium')

    expect(within(blocks[0]).getByTestId('plan-period-badge')).toHaveAttribute('data-tone', 'warning')
    expect(within(blocks[1]).getByTestId('plan-period-badge')).toHaveTextContent('In use')
    expect(within(blocks[1]).getByTestId('plan-period-badge')).toHaveAttribute('data-tone', 'neutral')
    expect(within(blocks[1]).queryByTestId('plan-period-chain')).toBeNull()
    expect(within(blocks[1]).getByText('Renews on 2027-06-30')).not.toHaveClass(WARNING_CLASS)
  })

  it('truncates a long plan chain with an ellipsis', () => {
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([
      {
        primary: 'Fixed-term membership',
        badges: [],
        secondary: 'Valid until 2027-12-31 (438 days left)',
        chain: ['Max', 'Pro', 'Starter', 'Lite'].map((plan, index) => ({ plan, current: index === 0 })),
        warning: false
      }
    ])
    render(<PlanPeriodRow billing={null} isLoading={false} />)

    const chain = screen.getByTestId('plan-period-chain')
    expect(chain).toHaveTextContent('MaxPro…')
    expect(within(chain).queryByText('Starter')).toBeNull()
    expect(within(chain).getByTestId('plan-period-chain-more')).toBeInTheDocument()
  })

  it('renders the rich tooltip with timeline rows and notes', () => {
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([
      { primary: 'Max', secondary: 'Valid until 2026-10-23', badges: [], chain: [], warning: false }
    ])
    vi.mocked(resolvePlanPeriodTooltip).mockReturnValue({
      timeline: [
        { tag: 'Current', plan: 'Max', range: '→ 2026-10-20' },
        { tag: 'Then', plan: 'Pro', range: '2026-10-20 → 2026-10-21' },
        { tag: 'Then', plan: 'Starter', range: '2026-10-21 → 2026-10-23' }
      ],
      notes: ['Your subscription resumes after the membership ends.']
    })
    render(<PlanPeriodRow billing={null} isLoading={false} />)

    expect(screen.getByTestId('plan-period-info')).toBeInTheDocument()
    const content = screen.getByTestId('tooltip-content')
    const rows = within(content).getAllByTestId('plan-period-timeline-row')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Current')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Pro')).toBeInTheDocument()
    expect(within(rows[2]).getByText('2026-10-21 → 2026-10-23')).toBeInTheDocument()
    expect(within(content).getByText('Your subscription resumes after the membership ends.')).toBeInTheDocument()
  })

  it('hides the info icon when the rich tooltip is empty', () => {
    vi.mocked(resolvePlanPeriodTooltip).mockReturnValue({ timeline: [], notes: [] })
    render(<PlanPeriodRow billing={null} isLoading={false} />)
    expect(screen.queryByTestId('plan-period-info')).toBeNull()
  })

  it('keeps the plain text tooltip in grace state and skips the rich tooltip', () => {
    vi.mocked(resolvePlanPeriodLabelInfo).mockReturnValue({
      labelKey: 'PICGO_CLOUD_PLAN_PERIOD_GRACE_LABEL',
      tooltipKey: 'PICGO_CLOUD_PLAN_PERIOD_GRACE_TOOLTIP'
    })
    vi.mocked(resolvePlanPeriodTooltip).mockReturnValue({
      timeline: [{ tag: 'Current', plan: 'Max', range: '→ 2026-10-20' }],
      notes: []
    })
    vi.mocked(resolvePlanPeriodBlocks).mockReturnValue([
      { primary: null, secondary: '2026-10-20', badges: [], chain: [], warning: false }
    ])
    render(<PlanPeriodRow billing={null} isLoading={false} />)

    expect(screen.getByText('PICGO_CLOUD_PLAN_PERIOD_GRACE_LABEL')).toBeInTheDocument()
    expect(screen.getAllByTestId('plan-period-info')).toHaveLength(1)
    const content = screen.getByTestId('tooltip-content')
    expect(within(content).getByText('PICGO_CLOUD_PLAN_PERIOD_GRACE_TOOLTIP')).toBeInTheDocument()
    expect(screen.queryByTestId('plan-period-timeline-row')).toBeNull()
  })
})
