import { inject } from 'vue'
import { storeKey } from '@/store'

export const useStore = () => {
  return inject(storeKey) ?? null
}
