import type { ReactNode } from 'react'
import { AppMainCard } from './app-main-card'

interface WorkspacePlaceholderProps {
  title: string
  rightAside?: ReactNode
}

export function WorkspacePlaceholder ({ title, rightAside }: WorkspacePlaceholderProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 gap-4">
      <AppMainCard title={title}>
        <div className="flex h-full min-h-0 items-center justify-center px-8 py-10 text-sm text-muted-foreground">
          {title}
        </div>
      </AppMainCard>
      {rightAside}
    </div>
  )
}
