<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$T('SETTINGS_CUSTOM_LINK_FORMAT')"
    :append-to-body="true"
  >
    <el-form
      ref="$customLink"
      label-position="top"
      :model="form"
      :rules="rules"
      size="small"
    >
      <el-form-item
        prop="customLink"
      >
        <div class="flex flex-col mb-[8px]">
          <div>
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_URL') }}
          </div>
          <div>
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_FILENAME') }}
          </div>
          <div>
            {{ $T('SETTINGS_TIPS_PLACEHOLDER_EXTNAME') }}
          </div>
        </div>
        <el-input
          v-model="form.customLink"
          class="align-center"
          :autofocus="true"
          size="default"
        />
      </el-form-item>
    </el-form>
    <div>
      {{ $T('SETTINGS_TIPS_SUCH_AS') }}[$fileName]($url)
    </div>
    <template #footer>
      <el-button
        size="default"
        round
        @click="cancelCustomLink"
      >
        {{ $T('CANCEL') }}
      </el-button>
      <el-button
        size="default"
        type="primary"
        round
        @click="confirmCustomLink"
      >
        {{ $T('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { T as $T } from '@/i18n'
import { useVModel } from '@/hooks/useVModel'
import { saveConfig, sendToMain } from '@/utils/dataSender'
import { ElForm, FormRules } from 'element-plus'
import { useVModelValues } from '@/hooks/useVModelValues'

interface IProps {
  modelValue: boolean
  customLink: string
}

const props = defineProps<IProps>()

const [form, updateProps] = useVModelValues<IProps>(props, ['customLink'])

const $customLink = ref<InstanceType<typeof ElForm> | null>(null)

const dialogVisible = useVModel(props, 'modelValue')

const customLinkRule = (rule: any, value: string, callback: (arg0?: Error) => void) => {
  if (!/\$url/.test(value) && !/\$fileName/.test(value) && !/\$extName/.test(value)) {
    return callback(new Error($T('TIPS_MUST_CONTAINS_URL')))
  } else {
    return callback()
  }
}

const rules = reactive<FormRules>({
  value: [
    { validator: customLinkRule, trigger: 'blur' }
  ]
})

function confirmCustomLink () {
  $customLink.value?.validate((valid: boolean) => {
    if (valid) {
      saveConfig('settings.customLink', form.customLink)
      dialogVisible.value = false
      sendToMain('updateCustomLink')
      updateProps()
    } else {
      return false
    }
  })
}

async function cancelCustomLink () {
  dialogVisible.value = false
  form.customLink = props.customLink
}

</script>
<script lang="ts">
export default {
  name: 'CustomLinkDialog'
}
</script>
<style lang='stylus'>
</style>
