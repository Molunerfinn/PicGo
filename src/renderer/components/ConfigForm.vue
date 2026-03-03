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
import { computed, reactive, ref, watch } from 'vue'
import { getConfig } from '@/utils/dataSender'
import { useRoute } from 'vue-router'
import BaseConfigForm from './form/BaseConfigForm.vue'
import { useConfigForm } from '@/hooks/useConfigForm'
import { useStore } from '@/hooks/useStore'

interface IProps {
  config: IPicGoPluginConfig[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  colorMode?: 'white' | 'dark'
}

const props = defineProps<IProps>()
const $route = useRoute()
const $form = ref<IFormInstance>()
const configList = ref<IPicGoPluginConfig[]>([])
const formModel = reactive<IStringKeyMap>({})
const isUploader = computed(() => props.type === 'uploader')
const store = useStore()

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

function resetFormModel () {
  Object.keys(formModel).forEach((key) => {
    delete formModel[key]
  })
}

async function handleConfig (inputConfig: IPicGoPluginConfig[]) {
  const currentConfig = await getCurConfigFormData()
  const resetConfig = isUploader.value && !$route.params.configId
  resetFormModel()
  Object.assign(formModel, currentConfig)
  configList.value = handleConfigForm(inputConfig, formModel, currentConfig, resetConfig)
}

async function getCurConfigFormData () {
  const configId = $route.params.configId
  const configType = getConfigType()
  if (isUploader.value) {
    const cachedList = store?.state.appConfig?.uploader?.[props.id]?.configList
    const curTypeConfigList = Array.isArray(cachedList)
      ? cachedList
      : await getConfig<IStringKeyMap[]>(`uploader.${props.id}.configList`) || []
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

watch(() => props.config, async (val: IPicGoPluginConfig[]) => {
  await handleConfig(val)
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
