<template>
  <div
    id="config-form"
    :class="props.colorMode === 'white' ? 'white' : ''"
  >
    <el-form
      ref="$form"
      label-position="left"
      label-width="50%"
      :model="ruleForm"
      size="small"
    >
      <el-form-item
        :label="$T('UPLOADER_CONFIG_NAME')"
        required
        prop="_configName"
      >
        <el-input
          v-model="ruleForm._configName"
          type="input"
          :placeholder="$T('UPLOADER_CONFIG_PLACEHOLDER')"
        />
      </el-form-item>
      <!-- dynamic config -->
      <el-form-item
        v-for="(item, index) in configList"
        :key="item.name + index"
        :label="item.alias || item.name"
        :required="item.required"
        :prop="item.name"
      >
        <el-input
          v-if="item.type === 'input' || item.type === 'password'"
          v-model="ruleForm[item.name]"
          @blur="inputBlur"
          :type="item.type === 'password' ? 'password' : 'input'"
          :placeholder="item.message || item.name"
        />
        <el-select
          v-else-if="item.type === 'list' && item.choices"
          v-model="ruleForm[item.name]"
          :placeholder="item.message || item.name"
        >
          <el-option
            v-for="choice in item.choices"
            :key="choice.name || choice.value || choice"
            :label="choice.name || choice.value || choice"
            :value="choice.value || choice"
          />
        </el-select>
        <el-select
          v-else-if="item.type === 'checkbox' && item.choices"
          v-model="ruleForm[item.name]"
          :placeholder="item.message || item.name"
          multiple
          collapse-tags
        >
          <el-option
            v-for="choice in item.choices"
            :key="choice.value || choice"
            :label="choice.name || choice.value || choice"
            :value="choice.value || choice"
          />
        </el-select>
        <div v-else-if="item.type === 'switch'">
          <el-popover
            ref="popover"
            placement="right"
            title="标题"
            width="200"
            trigger="hover"
            content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
          </el-popover>
          <i class="el-icon-share" v-popover:popover></i>

          <el-switch
            v-model="ruleForm[item.name]"
            active-text="开启"
            :disabled="!ruleForm.area || !ruleForm.appId || !ruleForm.bucket || !ruleForm.secretId || !ruleForm.secretKey || switchDisable"
            @change="switchCompress"
            inactive-text="关闭"
          />
        </div>
        <el-switch
          v-else-if="item.type === 'confirm'"
          v-model="ruleForm[item.name]"
          active-text="yes"
          inactive-text="no"
        />
      </el-form-item>
      <slot />
    </el-form>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, watch, toRefs } from 'vue'
import { cloneDeep, union } from 'lodash'
import { getConfig } from '@/utils/dataSender'
import { useRoute } from 'vue-router'
import type { FormInstance } from 'element-plus'
import { ElMessage as $message } from 'element-plus'

const COS = require('cos-nodejs-sdk-v5')

let cos:any = ''

let isCompress:any = ''
const initObject:any = {}

interface IProps {
  config: any[]
  type: 'uploader' | 'transformer' | 'plugin'
  id: string
  colorMode?: 'white' | 'dark'
}

const props = defineProps<IProps>()
const $route = useRoute()
const $form = ref<FormInstance>()

const configList = ref<IPicGoPluginConfig[]>([])
const ruleForm = reactive<IStringKeyMap>({})
const switchDisable = ref(false)

watch(toRefs(props.config), (val: IPicGoPluginConfig[]) => {
  handleConfigChange(val)
}, {
  deep: true,
  immediate: true
})

async function switchCompress (val: any) {
  const result = await validate()
  if (result !== false) {
    if (!initObject[ruleForm.secretId] && !initObject[ruleForm.secretKey]) {
      initCos(result)
    }
    if (val) {
      openImageSlim(result)
    } else {
      closeImageSlim(result)
    }
  }
}

function headBucket (ruleForm:any) {
  if (!initObject[ruleForm.secretId] && !initObject[ruleForm.secretKey]) {
    initCos(ruleForm)
  }
  const url = `http://${ruleForm.bucket}.cos.${ruleForm.area}.myqcloud.com/`

  cos.request({
    Method: 'HEAD',
    Url: url
  }, function (err:any, data:any) {
    if (err) {
      switchDisable.value = true
      if (err?.message === 'Not Found') {
        $message.error('未找到该存储桶')
      } else {
        $message.error(err)
      }
    }
    if (data) {
      if (data?.headers['x-cos-bucket-arch'] && data.headers['x-cos-bucket-arch'] === 'OFS') {
        $message.error('OFS 存储桶不支持极智压缩')
        switchDisable.value = true
      }
      if (data?.headers['x-cos-bucket-region']) {
        switchDisable.value = false
        getImageSlim(ruleForm)
      }
    }
  })
}

function inputBlur () {
  if (ruleForm.area && ruleForm.appId && ruleForm.bucket && ruleForm.secretId && ruleForm.secretKey && !initObject[ruleForm.bucket] && !initObject[ruleForm.bucket]) {
    headBucket(ruleForm)
  }
}

function initCos (result: any) {
  cos = new COS({
    // 必选参数
    SecretId: result.secretId,
    SecretKey: result.secretKey
  })
  initObject[result.secretId] = true
  initObject[result.secretKey] = true
}

function handleConfigChange (val: any) {
  handleConfig(val)
}

function getImageSlim (result: any) {
  if (!initObject[result.secretId] && !initObject[result.secretKey]) {
    initCos(result)
  }
  const url = `http://${result.bucket}.pic.${result.area}.myqcloud.com/`
  cos.request({
    Method: 'GET',
    Url: url,
    Query: {
      'image-slim': ''
    }
  }, function (err:any, data:any) {
    if (err) {
      if (err?.message === 'Not Found') {
        $message.error('未找到该存储桶')
      } else if (err.message === 'Region unsupport') {
        $message.error('该地域不支持极智压缩')
      } else if (err.message === 'Ups app not exist') {
        $message.error('请绑定数据万象服务')
      } else {
        $message.error(err)
      }
      switchDisable.value = true
    }
    if (data) {
      switchDisable.value = false
      if (data?.ImageSlim?.Status === 'off') {
        isCompress = false
        ruleForm.compress = isCompress
      } else if (data?.ImageSlim?.Status === 'on') {
        isCompress = true
        ruleForm.compress = isCompress
      }

      initObject[result.bucket] = true
      initObject[result.area] = true
    }
  })
}

function openImageSlim (result:any) {
  const url = `http://${result.bucket}.pic.${result.area}.myqcloud.com/`
  cos.request({
    Method: 'PUT',
    Url: url,
    Query: {
      'image-slim': ''
    },
    Headers: {
      'Content-Type': 'application/xml'
    },
    Body: COS.util.json2xml({
      ImageSlim: {
        SlimMode: 'API,Auto',
        Suffixs: {
          Suffix: [
            'jpg',
            'png'
          ]
        }
      }
    })
  }, function (err:any, data:any) {
    if (err) {
      ruleForm.compress = !ruleForm.compress
      $message.error(err)
    }

    if (data) {
      $message.success('开启极智压缩成功')
    }
  })
}

function closeImageSlim (result: any) {
  const url = `http://${result.bucket}.pic.${result.area}.myqcloud.com/`

  cos.request({
    Method: 'DELETE',
    Url: url,
    Query: {
      'image-slim': ''
    }
  }, function (err:any, data:any) {
    if (data) {
      $message.success('关闭极智压缩成功')
    }
    if (err) {
      ruleForm.compress = !ruleForm.compress
      $message.error(err)
    }
  })
}

async function validate (): Promise<IStringKeyMap | false> {
  return new Promise((resolve) => {
    $form.value?.validate((valid: boolean) => {
      if (valid) {
        resolve(ruleForm)
      } else {
        resolve(false)
        return false
      }
    })
  })
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

async function handleConfig (val: IPicGoPluginConfig[]) {
  const config = await getCurConfigFormData()
  const configId = $route.params.configId
  Object.assign(ruleForm, config)
  if (val.length > 0) {
    configList.value = cloneDeep(val).map((item) => {
      if (!configId) return item
      let defaultValue = item.default !== undefined
        ? item.default
        : item.type === 'checkbox'
          ? []
          : null
      if (item.type === 'checkbox') {
        const defaults = item.choices?.filter((i: any) => {
          return i.checked
        }).map((i: any) => i.value) || []
        defaultValue = union(defaultValue, defaults)
      }
      if (config && config[item.name] !== undefined) {
        defaultValue = config[item.name]
      }
      ruleForm[item.name] = defaultValue
      return item
    })
  }
}

async function getCurConfigFormData () {
  const configId = $route.params.configId
  const curTypeConfigList = await getConfig<IStringKeyMap[]>(`uploader.${props.id}.configList`) || []
  return curTypeConfigList.find(i => i._id === configId) || {}
}

defineExpose({
  validate,
  getConfigType
})
</script>
<style lang='stylus'>
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
