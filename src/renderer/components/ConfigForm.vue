<template>
  <div
    id="config-form"
    :class="props.colorMode === 'white' ? 'white' : ''"
  >
    <BaseConfigForm
      ref="$form"
      :config="configList"
      :form-model="formModel"
    >
      <template #extra-form>
        <el-form-item
          v-if="isUploader"
          :label="$T('UPLOADER_CONFIG_NAME')"
          required
          prop="_configName"
        >
          <el-input
            v-model="formModel._configName"
            type="input"
            :placeholder="$T('UPLOADER_CONFIG_PLACEHOLDER')"
          />
        </el-form-item>
      </template>
      <slot />
    </BaseConfigForm>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, watch, toRefs } from 'vue'
import { getConfig } from '@/utils/dataSender'
import { useRoute } from 'vue-router'
import BaseConfigForm from './form/BaseConfigForm.vue'
import { useConfigForm } from '@/hooks/useConfigForm'

interface IProps {
  config: any[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  colorMode?: 'white' | 'dark'
}

const props = defineProps<IProps>()
const $route = useRoute()
const $form = ref<IFormInstance>()
const configList = ref<IPicGoPluginConfig[]>([])
const formModel = reactive<IStringKeyMap>({})
const isUploader = props.type === 'uploader'

async function validate (): Promise<IStringKeyMap | false> {
  const res = await $form.value?.validate() || false
  return res
}

function getConfigType () {
  switch (props.type) {
    case 'plugin': {
      return props.id
    }
    case 'uploader': {
      return `picBed.${props.id}`
    }
    case 'transformer': {
      return `transformer.${props.id}`
    }
    default:
      return 'unknown'
  }
}

const handleConfigForm = useConfigForm()

async function handleConfig (inputConfig: IPicGoPluginConfig[]) {
  const currentConfig = await getCurConfigFormData()
  const resetConfig = isUploader && !$route.params.configId
  Object.assign(formModel, currentConfig)
  configList.value = handleConfigForm(inputConfig, formModel, currentConfig, resetConfig)
}

async function getCurConfigFormData () {
  const configId = $route.params.configId
  const configType = getConfigType()
  if (isUploader) {
    const curTypeConfigList = await getConfig<IStringKeyMap[]>(`uploader.${props.id}.configList`) || []
    return curTypeConfigList.find(i => i._id === configId) || {}
  } else {
    const config = await getConfig<IStringKeyMap>(configType)
    return config || {}
  }
}

async function resetConfig () {
  const config = await getCurConfigFormData()
  Object.assign(formModel, config)
}

watch(toRefs(props.config), (val: IPicGoPluginConfig[]) => {
  handleConfig(val)
}, {
  deep: true,
  immediate: true
})

defineExpose({
  validate,
  getConfigType,
  resetConfig
})
</script>
<style lang='stylus'>
.config-form-common-tips
  a
    color #409EFF
    text-decoration none
#config-form
  .el-form
    label
      line-height 22px
      padding-bottom 0
    &-item
      display: flex
      justify-content space-between
      border-bottom 1px solid darken(#eee, 50%)
      padding-bottom 16px
      &:last-child
        border-bottom none
      &__content
        justify-content flex-end
    .el-button-group
      width 100%
      .el-button
        width 50%
    .el-radio-group
      margin-left 25px
    .el-switch__label
      &.is-active
        color #409EFF
  &.white
    .el-form-item
      border-bottom 1px solid #ddd
</style>
