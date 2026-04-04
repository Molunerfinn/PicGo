import { useEffect } from 'react'
import { APP_CONFIG_UPDATED } from '#/events/constants'
import { appActions } from '@/store'
import { ipc } from '@/utils/bridge'

export function RendererRuntimeBridge () {
  // Hydrate the shared renderer state once when the React shell boots.
  useEffect(() => {
    appActions.hydrateAppState().catch((error) => {
      console.error('Failed to hydrate renderer app state', error)
    })
    appActions.hydratePicGoCloudUserInfo().catch((error) => {
      console.error('Failed to hydrate PicGo Cloud user info', error)
    })
  }, [])

  // Refresh config-derived state whenever the main process broadcasts an app-config update.
  useEffect(() => {
    const handleAppConfigUpdated = () => {
      Promise.all([
        appActions.refreshAppConfig(),
        appActions.refreshPicBeds()
      ]).catch((error) => {
        console.error('Failed to refresh renderer app state after config update', error)
      })
    }

    return ipc.on(APP_CONFIG_UPDATED, handleAppConfigUpdated)
  }, [])

  return null
}
