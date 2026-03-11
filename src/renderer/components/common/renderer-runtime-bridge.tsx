import { useEffect } from 'react'
import { appConfigAdapter } from '@/adapters/app-config'
import { appActions } from '@/store'

export function RendererRuntimeBridge () {
  // Hydrate the shared renderer state once when the React shell boots.
  useEffect(() => {
    appActions.hydrateAppState().catch((error) => {
      console.error('Failed to hydrate renderer app state', error)
    })
  }, [])

  // Refresh config-derived state whenever the main process broadcasts an app-config update.
  useEffect(() => {
    const unsubscribe = appConfigAdapter.subscribeToUpdates(() => {
      Promise.all([
        appActions.refreshAppConfig(),
        appActions.refreshPicBeds()
      ]).catch((error) => {
        console.error('Failed to refresh renderer app state after config update', error)
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return null
}
