<template>
  <div id="picbeds-page">
    <el-row
      :gutter="20"
      class="setting-list"
    >
      <el-col
        :span="20"
        :offset="2"
      >
        <div class="view-title">
          {{ picBedName }} {{ $T('SETTINGS') }}
        </div>
        <config-form
          v-if="config.length > 0"
          :id="type"
          ref="$configForm"
          :config="config"
          type="uploader"
        >
          <el-form-item>
            <el-button
              class="confirm-btn"
              type="primary"
              round
              @click="handleConfirm"
            >
              {{ $T('CONFIRM') }}
            </el-button>
          </el-form-item>
        </config-form>
        <div
          v-else
          class="single"
        >
          <div class="notice">
            {{ $T('SETTINGS_NOT_CONFIG_OPTIONS') }}
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
import { IRPCActionType } from '~/universal/types/enum'
import { ref, onBeforeMount } from 'vue'
import { T as $T } from '@/i18n/index'
import { sendToMain, triggerRPC } from '@/utils/dataSender'
import { useRoute, useRouter } from 'vue-router'
import ConfigForm from '@/components/ConfigForm.vue'
// import mixin from '@/utils/ConfirmButtonMixin'
import {
  IpcRendererEvent
} from 'electron'
import { GET_PICBED_CONFIG } from '~/universal/events/constants'
import { useIPCOn } from '@/hooks/useIPC'
const type = ref('')
const config = ref<IPicGoPluginConfig[]>([])
const picBedName = ref('')
const $route = useRoute()
const $router = useRouter()
const $configForm = ref<InstanceType<typeof ConfigForm> | null>(null)
type.value = $route.params.type as string

useIPCOn(GET_PICBED_CONFIG, getPicBeds)

onBeforeMount(() => {
  sendToMain(GET_PICBED_CONFIG, $route.params.type)
})

const handleConfirm = async () => {
  const result = (await $configForm.value?.validate()) || false
  if (result !== false) {
    await triggerRPC<void>(IRPCActionType.UPDATE_UPLOADER_CONFIG, type.value, result?._id, result)
    const successNotification = new Notification($T('SETTINGS_RESULT'), {
      body: $T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
    $router.back()
  }
}

function getPicBeds (event: IpcRendererEvent, _config: IPicGoPluginConfig[], name: string) {
  config.value = _config
  picBedName.value = name
}

</script>
<script lang="ts">
export default {
  name: 'PicbedsPage'
}
</script>
<style lang='stylus'>
#picbeds-page
  .setting-list
    height 425px
    overflow-y auto
    overflow-x hidden
  .confirm-btn
    width: 250px
  .el-form
    label
      line-height 22px
      padding-bottom 0
      color #eee
    &-item
      margin-bottom 16px
    .el-button-group
      width 100%
      .el-button
        width 50%
    .el-radio-group
      margin-left 25px
    .el-switch__label
      color #eee
      &.is-active
        color #409EFF
  .notice
    color #eee
    text-align center
    margin-bottom 10px
  .single
    text-align center
</style>
