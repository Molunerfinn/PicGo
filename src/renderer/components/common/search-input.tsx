import { SearchIcon, XIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  placeholder: string
  ariaLabel: string
  clearLabel: string
  onValueChange: (value: string) => void
  className?: string
  inputClassName?: string
  clearButtonClassName?: string
}

export function SearchInput ({
  value,
  placeholder,
  ariaLabel,
  clearLabel,
  onValueChange,
  className,
  inputClassName,
  clearButtonClassName
}: SearchInputProps) {
  const hasSearch = value.trim().length > 0

  return (
    <InputGroup className={cn('bg-background/70', className)}>
      <InputGroupAddon>
        <SearchIcon className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value)
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={inputClassName}
      />
      {hasSearch
        ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              className={cn(
                'text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground',
                clearButtonClassName
              )}
              onClick={() => {
                onValueChange('')
              }}
              title={clearLabel}
              aria-label={clearLabel}
            >
              <XIcon className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        )
        : null}
    </InputGroup>
  )
}
