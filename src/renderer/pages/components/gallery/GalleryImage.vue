<script setup lang="ts">
import { ref, toRefs } from 'vue'

interface GalleryImageProps { objectFit?: 'contain' | 'cover', lazySrc?: string }
const props = withDefaults(defineProps<GalleryImageProps>(), { objectFit: 'contain', lazySrc: '' })
const { objectFit, lazySrc } = toRefs(props)
const imgRef = ref<HTMLImageElement>()
const coverScale = ref(1)

const onImgLoad = (e: Event) => {
  const { naturalWidth, naturalHeight } = e.target as HTMLImageElement
  const base = naturalWidth / naturalHeight
  coverScale.value = base < 1 ? (1 / base) : base
}
</script>

<template>
  <img
    ref="imgRef"
    v-lazy="lazySrc"
    class="duration-300"
    :style="{
      transform: objectFit === 'cover' ? `scale(${coverScale})` : 'scale(1)',
    }"
    @load="onImgLoad"
  >
</template>

<style scoped></style>
