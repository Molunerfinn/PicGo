<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '@/hooks/useStore'
import { onBeforeMount, onMounted, onUnmounted } from 'vue'
import bus from './utils/bus'
import { APP_CONFIG_UPDATED, FORCE_UPDATE } from '~/universal/events/constants'
import { useATagClick } from './hooks/useATagClick'
import { useIPCOn } from './hooks/useIPC'

useATagClick()

const store = useStore()
const handleAppConfigUpdated = () => {
  store?.refreshAppConfig()
  store?.refreshPicBeds()
}

onBeforeMount(async () => {
  if (!store) return
  await store.refreshAppConfig()
  await store.refreshPicBeds()
})

useIPCOn(APP_CONFIG_UPDATED, handleAppConfigUpdated)

onMounted(() => {
  bus.on(FORCE_UPDATE, () => {
    store?.updateForceUpdateTime()
  })
})

onUnmounted(() => {
  bus.off(FORCE_UPDATE)
})

</script>

<script lang="ts">
export default {
  name: 'PicGoApp'
}
</script>

<style lang="stylus">
  body,
  html
    padding 0
    margin 0
    height 100%
    font-family "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif
  #app
    user-select none
    overflow hidden
  .el-button-group
    width 100%
    .el-button
      width 50%
</style>
