<template>
  <div class="">
    <ConfirmDialog
      v-model="visible"
      :title="title"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @close="handleCancel"
    >
      <template #body>
        <BaseConfigForm
          ref="$form"
          :config="configList"
          :form-model="formModel"
          theme="light"
        />
      </template>
    </ConfirmDialog>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import ConfirmDialog from '@/components/dialog/ConfirmDialog.vue'
import { useIPCOn } from '@/hooks/useIPC'
import { IRPCActionType } from '~/universal/types/enum'
import BaseConfigForm from '@/components/form/BaseConfigForm.vue'
import { useConfigForm } from '@/hooks/useConfigForm'
import { sendToMain } from '@/utils/dataSender'

const configList = ref<IPicGoPluginConfig[]>([])
const formModel = reactive<IStringKeyMap>({})
const $form = ref<IFormInstance>()
const title = ref('')

const handleConfigForm = useConfigForm()

const visible = ref(false)
useIPCOn(IRPCActionType.OPEN_CONFIG_DIALOG, (event, options: IPicGoPluginShowConfigDialogOption) => {
  visible.value = true
  configList.value = handleConfigForm(options.config, formModel)
  title.value = options.title
})
const handleConfirm = async () => {
  const res = await $form.value?.validate() || false
  if (!res) {
    return
  }
  sendToMain(IRPCActionType.OPEN_CONFIG_DIALOG, res)
  visible.value = false
}
const handleCancel = () => {
  visible.value = false
  sendToMain(IRPCActionType.OPEN_CONFIG_DIALOG, false)
}

</script>
<script lang="ts">
export default {
  name: 'ConfigFormDialog'
}
</script>
<style lang='stylus'>
</style>
