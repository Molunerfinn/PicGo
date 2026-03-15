import { RefreshCwIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { pluginsAdapter } from "@/adapters/plugins"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"

export function AppReloadBar() {
  const { t } = useTranslation()
  const needReload = useAppStore((state) => state.appConfig?.needReload ?? false)

  return (
    <AnimatePresence>
      {needReload ? (
        <motion.div
          key="app-reload-bar"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="pointer-events-none absolute inset-x-0 bottom-8 z-40 flex justify-center px-6"
        >
          <div className="pointer-events-auto flex min-h-14 w-full max-w-[calc(100%-3rem)] items-center justify-center rounded-[22px] border border-border/50 bg-background/78 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-md dark:bg-card/72">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-[10px] px-3 text-xs font-medium shadow-none"
              onClick={() => {
                pluginsAdapter.reloadApp()
              }}
            >
              <RefreshCwIcon className="size-3.5" />
              {t("TIPS_NEED_RELOAD")}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
