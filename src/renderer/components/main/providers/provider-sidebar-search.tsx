import { SearchIcon, XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface ProviderSidebarSearchProps {
  searchValue: string
  hasSearch: boolean
  onSearchValueChange: (value: string) => void
}

export function ProviderSidebarSearch({
  searchValue,
  hasSearch,
  onSearchValueChange,
}: ProviderSidebarSearchProps) {
  const { t } = useTranslation()

  return (
    <InputGroup className="bg-background/70">
      <InputGroupAddon>
        <SearchIcon className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        value={searchValue}
        onChange={(event) => onSearchValueChange(event.target.value)}
        placeholder={t("SEARCH")}
        aria-label={t("SEARCH")}
      />
      {hasSearch ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            className="text-muted-foreground transition-all duration-300 hover:bg-(--app-provider-sidebar-item-hover-bg) hover:text-(--app-provider-sidebar-item-active-color)"
            onClick={() => onSearchValueChange("")}
            title={t("GALLERY_CLEAR_SELECTION")}
            aria-label={t("GALLERY_CLEAR_SELECTION")}
          >
            <XIcon className="size-3.5" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
