import { onBeforeMount, ref } from 'vue'
import { getPlatform } from '@/utils/bridge'

export const useOS = () => {
  const os = ref<string>('')

  onBeforeMount(() => {
    os.value = getPlatform()
  })
  return os
}
