import { useEffect } from 'react'
import { appActions, galleryStoreActions } from '@/store'

export function RendererStoreHydrator () {
  useEffect(() => {
    async function hydrateStores () {
      try {
        await Promise.all([
          appActions.ensureHydrated(),
          galleryStoreActions.ensureHydrated()
        ])
      } catch (error) {
        console.error(error)
      }
    }

    hydrateStores()
  }, [])

  return null
}
