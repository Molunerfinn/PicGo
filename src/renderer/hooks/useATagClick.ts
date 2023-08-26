import { openURL } from '@/utils/common'
import { onMounted, onUnmounted } from 'vue'

export function useATagClick () {
  const handleATagClick = (e: MouseEvent) => {
    if (e.target instanceof HTMLAnchorElement) {
      if (e.target.href) {
        e.preventDefault()
        openURL(e.target.href)
      }
    }
  }
  onMounted(() => {
    document.addEventListener('click', handleATagClick)
  })
  onUnmounted(() => {
    document.removeEventListener('click', handleATagClick)
  })
}
