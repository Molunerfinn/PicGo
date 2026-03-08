import { onBeforeMount, ref } from 'vue'

export const useOS = () => {
  const os = ref<string>('')

  onBeforeMount(() => {
    os.value = process.platform
  })
  return os
}
