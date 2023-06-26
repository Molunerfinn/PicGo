<template>
  <el-dialog
    v-model="dialogVisible"
    class="server-dialog"
    width="60%"
    :title="$T('SETTINGS_SET_PICGO_SERVER')"
    :append-to-body="true"
  >
    <div class="notice-text">
      {{ $T('SETTINGS_TIPS_SERVER_NOTICE') }}
    </div>
    <el-form
      label-position="right"
      label-width="120px"
    >
      <el-form-item
        :label="$T('SETTINGS_ENABLE_SERVER')"
      >
        <el-switch
          v-model="form.enable"
          :active-text="$T('SETTINGS_OPEN')"
          :inactive-text="$T('SETTINGS_CLOSE')"
        />
      </el-form-item>
      <template v-if="form.enable">
        <el-form-item
          :label="$T('SETTINGS_SET_SERVER_HOST')"
        >
          <el-input
            v-model="form.host"
            type="input"
            :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_HOST')"
          />
        </el-form-item>
        <el-form-item
          :label="$T('SETTINGS_SET_SERVER_PORT')"
        >
          <el-input
            v-model="form.port"
            type="number"
            :placeholder="$T('SETTINGS_TIP_PLACEHOLDER_PORT')"
          />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button
        size="default"
        round
        @click="cancelServerSetting"
      >
        {{ $T('CANCEL') }}
      </el-button>
      <el-button
        size="default"
        type="primary"
        round
        @click="confirmServerSetting"
      >
        {{ $T('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { T as $T } from '@/i18n'
import { useVModel } from '@/hooks/useVModel'
import { useVModelValues } from '@/hooks/useVModelValues'
import { saveConfig, sendToMain } from '@/utils/dataSender'
import { showNotification } from '@/utils/common'

interface IProps {
  modelValue: boolean
  port: number
  host: string
  enable: boolean
}

const props = defineProps<IProps>()

const dialogVisible = useVModel(props, 'modelValue')
const [form, updateProps] = useVModelValues<IProps>(props, ['port', 'host', 'enable'])

function confirmServerSetting () {
  form.port = parseInt(form.port as unknown as string, 10)
  saveConfig({
    'settings.server': form
  })
  showNotification($T('SETTINGS_SET_PICGO_SERVER'), $T('TIPS_SET_SUCCEED'))
  dialogVisible.value = false
  sendToMain('updateServer')
  updateProps()
}

async function cancelServerSetting () {
  dialogVisible.value = false
  form.port = props.port
  form.host = props.host
  form.enable = props.enable
}
</script>
<script lang="ts">
export default {
  name: 'ServerSettingsDialog'
}
</script>
<style lang='stylus'>
</style>
