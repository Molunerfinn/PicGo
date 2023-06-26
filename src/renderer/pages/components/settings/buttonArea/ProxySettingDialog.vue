<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$T('SETTINGS_SET_PROXY_AND_MIRROR')"
    :append-to-body="true"
    width="70%"
  >
    <el-form
      label-position="right"
      label-width="120px"
    >
      <el-form-item
        :label="$T('SETTINGS_UPLOAD_PROXY')"
      >
        <el-input
          v-model="form.proxy"
          :autofocus="true"
          :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
        />
      </el-form-item>
      <el-form-item
        :label="$T('SETTINGS_PLUGIN_INSTALL_PROXY')"
      >
        <el-input
          v-model="form.npmProxy"
          :autofocus="true"
          :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：http://127.0.0.1:1080`"
        />
      </el-form-item>
      <el-form-item
        :label="$T('SETTINGS_PLUGIN_INSTALL_MIRROR')"
      >
        <el-input
          v-model="form.npmRegistry"
          :autofocus="true"
          :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：https://registry.npmmirror.com`"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        size="default"
        round
        @click="cancelProxy"
      >
        {{ $T('CANCEL') }}
      </el-button>
      <el-button
        size="default"
        type="primary"
        round
        @click="confirmProxy"
      >
        {{ $T('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { T as $T } from '@/i18n'
import { useVModel } from '@/hooks/useVModel'
import { saveConfig } from '@/utils/dataSender'
import { useVModelValues } from '@/hooks/useVModelValues'
import { showNotification } from '@/utils/common'

interface IProps {
  modelValue: boolean
  proxy: string
  npmProxy: string
  npmRegistry: string
}
const props = defineProps<IProps>()

const [form, updateProps] = useVModelValues<IProps>(props, ['proxy', 'npmProxy', 'npmRegistry'])

const dialogVisible = useVModel(props, 'modelValue')

function confirmProxy () {
  dialogVisible.value = false
  saveConfig({
    'picBed.proxy': form.proxy,
    'settings.npmProxy': form.npmProxy,
    'settings.npmRegistry': form.npmRegistry
  })
  showNotification($T('SETTINGS_SET_PROXY_AND_MIRROR'), $T('TIPS_SET_SUCCEED'))
  updateProps()
}

async function cancelProxy () {
  dialogVisible.value = false
  form.proxy = props.proxy || ''
  form.npmProxy = props.npmProxy || ''
  form.npmRegistry = props.npmRegistry || ''
}

</script>
<script lang="ts">
export default {
  name: 'ProxySettingDialog'
}
</script>
<style lang='stylus'>
</style>
