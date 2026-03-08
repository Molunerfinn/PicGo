import { useEffect } from 'react'
import { appConfigAdapter } from '@/adapters/app-config'
import { useStore } from '@/store'

export function RendererRuntimeBridge () {
  const hydrateAppState = useStore((state) => state.hydrateAppState)
  const refreshAppConfig = useStore((state) => state.refreshAppConfig)
  const refreshPicBeds = useStore((state) => state.refreshPicBeds)

  // Hydrate the shared renderer state once when the React shell boots.
  useEffect(() => {
    hydrateAppState().catch((error) => {
      console.error('Failed to hydrate renderer app state', error)
    })
  }, [hydrateAppState])

  // Refresh config-derived state whenever the main process broadcasts an app-config update.
  useEffect(() => {
    const unsubscribe = appConfigAdapter.subscribeToUpdates(() => {
      Promise.all([
        refreshAppConfig(),
        refreshPicBeds()
      ]).catch((error) => {
        console.error('Failed to refresh renderer app state after config update', error)
      })
    })

    return () => {
      unsubscribe()
    }
  }, [refreshAppConfig, refreshPicBeds])

  return null
}
