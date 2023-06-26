<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$T('SETTINGS_SET_LOG_FILE')"
    :append-to-body="true"
    width="500px"
  >
    <el-form
      label-position="right"
      label-width="150px"
    >
      <el-form-item
        :label="$T('SETTINGS_LOG_FILE')"
      >
        <el-button
          type="primary"
          round
          size="small"
          @click="openFile('picgo.log')"
        >
          {{ $T('SETTINGS_CLICK_TO_OPEN') }}
        </el-button>
      </el-form-item>
      <el-form-item
        :label="$T('SETTINGS_LOG_LEVEL')"
      >
        <el-select
          v-model="form.logLevel"
          multiple
          collapse-tags
          style="width: 100%;"
        >
          <el-option
            v-for="(value, key) of logLevelMap"
            :key="key"
            :label="value"
            :value="key"
            :disabled="handleLevelDisabled(key)"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="`${$T('SETTINGS_LOG_FILE_SIZE')} (MB)`"
      >
        <el-input-number
          v-model="form.logFileSizeLimit"
          style="width: 100%;"
          :placeholder="`${$T('SETTINGS_TIPS_SUCH_AS')}：10`"
          :controls="false"
          :min="1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        size="default"
        round
        @click="cancelLogLevelSetting"
      >
        {{ $T('CANCEL') }}
      </el-button>
      <el-button
        size="default"
        type="primary"
        round
        @click="confirmLogLevelSetting"
      >
        {{ $T('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { T as $T } from '@/i18n'
import { saveConfig } from '@/utils/dataSender'
import { useVModel } from '@/hooks/useVModel'
import { openFile, showNotification } from '@/utils/common'
import { ElMessage as $message } from 'element-plus'
import { useVModelValues } from '@/hooks/useVModelValues'

const logLevelMap = {
  all: $T('SETTINGS_LOG_LEVEL_ALL'),
  success: $T('SETTINGS_LOG_LEVEL_SUCCESS'),
  error: $T('SETTINGS_LOG_LEVEL_ERROR'),
  info: $T('SETTINGS_LOG_LEVEL_INFO'),
  warn: $T('SETTINGS_LOG_LEVEL_WARN'),
  none: $T('SETTINGS_LOG_LEVEL_NONE')
}

interface IProps {
  modelValue: boolean
  logLevel: string[]
  logFileSizeLimit: number
}

const props = defineProps<IProps>()

const dialogVisible = useVModel(props, 'modelValue')

const [form, updateProps] = useVModelValues<IProps>(props, ['logFileSizeLimit', 'logLevel'])

async function cancelLogLevelSetting () {
  dialogVisible.value = false
  let logLevel = props.logLevel as string | string[]
  if (!Array.isArray(logLevel)) {
    if (logLevel && logLevel.length > 0) {
      logLevel = [logLevel]
    } else {
      logLevel = ['all']
    }
  }
  form.logLevel = logLevel
  form.logFileSizeLimit = props.logFileSizeLimit
}

function confirmLogLevelSetting () {
  if (form.logLevel.length === 0) {
    return $message.error($T('TIPS_PLEASE_CHOOSE_LOG_LEVEL'))
  }
  saveConfig({
    'settings.logLevel': form.logLevel,
    'settings.logFileSizeLimit': form.logFileSizeLimit
  })
  showNotification($T('SETTINGS_SET_LOG_FILE'), $T('TIPS_SET_SUCCEED'))
  updateProps()
  dialogVisible.value = false
}

function handleLevelDisabled (val: string) {
  const currentLevel = val
  let flagLevel
  const result = form.logLevel.some((item: any) => {
    if (item === 'all' || item === 'none') {
      flagLevel = item
    }
    return (item === 'all' || item === 'none')
  })
  if (result) {
    if (currentLevel !== flagLevel) {
      return true
    }
  } else if (form.logLevel.length > 0) {
    if (val === 'all' || val === 'none') {
      return true
    }
  }
  return false
}
</script>
<script lang="ts">
export default {
  name: 'LogSettingDialog'
}
</script>
<style lang='stylus'>
</style>
