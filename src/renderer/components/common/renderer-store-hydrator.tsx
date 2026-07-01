import { useEffect } from 'react'
import { appActions, albumStoreActions } from '@/store'

export function RendererStoreHydrator () {
  useEffect(() => {
    async function hydrateStores () {
      try {
        await Promise.all([
          appActions.ensureHydrated(),
          albumStoreActions.ensureHydrated()
        ])
      } catch (error) {
        console.error(error)
      }
    }

    hydrateStores()
  }, [])

  return null
}
