import { ChevronDownIcon, DatabaseIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { providerStoreActions } from "@/store"

export interface UploaderSwitcherConfigItem {
  id: string
  name: string
}

export interface UploaderSwitcherProviderItem {
  id: string
  name: string
  configs: UploaderSwitcherConfigItem[]
}

export interface UploaderSwitcherValue {
  providerId: string
  providerName: string
  configId: string
  configName: string
}

interface UploaderSwitcherProps {
  current: UploaderSwitcherValue
  providers: UploaderSwitcherProviderItem[]
  disabled?: boolean
}

export function UploaderSwitcher({
  current,
  providers,
  disabled,
}: UploaderSwitcherProps) {
  const { t } = useTranslation()

  const handleConfigSelect = async (next: UploaderSwitcherValue) => {
    try {
      await providerStoreActions.selectDashboardProviderConfig(
        next.providerId,
        next.configId
      )
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("OPERATION_FAILED")

      toast.error(message)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="group h-10 cursor-pointer bg-card/80 px-4 backdrop-blur transition-all hover:border-primary/30"
          disabled={disabled}
        >
          <span className="size-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {current.providerName}
            <span className="mx-1 font-normal text-muted-foreground">/</span>
            {current.configName}
          </span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 rounded-xl">
        <DropdownMenuLabel className="uppercase tracking-wider">
          {t("UPLOADER_SWITCHER_SELECT_PROVIDER")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {providers.map((provider) => (
          <DropdownMenuSub key={provider.id}>
            <DropdownMenuSubTrigger className="rounded-md">
              <DatabaseIcon className="text-muted-foreground" />
              <span className="flex-1">{provider.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-40">
              <DropdownMenuLabel>{t("UPLOADER_SWITCHER_CONFIG")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {provider.configs.length > 0 ? (
                provider.configs.map((config) => (
                  <DropdownMenuItem
                    key={`${provider.id}:${config.id}`}
                    onSelect={async () => {
                      await handleConfigSelect({
                        providerId: provider.id,
                        providerName: provider.name,
                        configId: config.id,
                        configName: config.name,
                      })
                    }}
                  >
                    {config.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  {t("UPLOADER_SWITCHER_NO_CONFIG")}
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
