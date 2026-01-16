<template>
  <el-dialog
    v-model="visible"
    fullscreen
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="picgo-cloud-config-sync-conflict-dialog"
  >
    <template #header>
      <div class="flex items-center justify-between gap-[12px]">
        <div class="text-[14px] text-[#ddd]">
          {{ $T('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_TITLE', { count: conflicts.length }) }}
        </div>
        <div class="flex items-center gap-[8px]">
          <el-button
            size="small"
            @click="handleChooseAllLocal"
          >
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_CHOOSE_ALL_LOCAL') }}
          </el-button>
          <el-button
            size="small"
            @click="handleChooseAllCloud"
          >
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_CHOOSE_ALL_CLOUD') }}
          </el-button>
          <el-button
            size="small"
            @click="handleResetAll"
          >
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_RESET_ALL') }}
          </el-button>
        </div>
      </div>
    </template>

    <div class="h-full">
      <div class="h-full overflow-auto pr-[8px]">
        <div
          v-for="item in conflicts"
          :key="item.path"
          class="mb-[12px] rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[rgba(130,130,130,0.10)] p-[12px]"
        >
          <div class="mb-[8px] text-[12px] text-[#bbb] leading-[18px] break-all">
            {{ item.path }}
          </div>

          <div class="grid grid-cols-2 gap-[12px]">
            <div
              class="rounded-[8px] border p-[10px] cursor-pointer transition-colors"
              :class="localBoxClass(item.path)"
              @click="setChoice(item.path, IPicGoCloudConfigSyncConflictChoice.LOCAL)"
            >
              <div class="mb-[6px] text-[12px] text-[#ddd]">
                {{ $T('PICGO_CLOUD_CONFIG_SYNC_LOCAL_VERSION') }}
              </div>
              <pre class="text-[12px] text-[#bbb] leading-[18px] whitespace-pre-wrap break-words">{{ formatValue(item.localValue) }}</pre>
            </div>

            <div
              class="rounded-[8px] border p-[10px] cursor-pointer transition-colors"
              :class="cloudBoxClass(item.path)"
              @click="setChoice(item.path, IPicGoCloudConfigSyncConflictChoice.CLOUD)"
            >
              <div class="mb-[6px] text-[12px] text-[#ddd]">
                {{ $T('PICGO_CLOUD_CONFIG_SYNC_CLOUD_VERSION') }}
              </div>
              <pre class="text-[12px] text-[#bbb] leading-[18px] whitespace-pre-wrap break-words">{{ formatValue(item.remoteValue) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <el-button
          type="danger"
          plain
          :disabled="confirmLoading"
          @click="handleAbort"
        >
          {{ $T('PICGO_CLOUD_CONFIG_SYNC_ABORT') }}
        </el-button>
        <el-button
          type="primary"
          :loading="confirmLoading"
          :disabled="isConfirmDisabled || confirmLoading"
          @click="handleConfirm"
        >
          {{ $T('PICGO_CLOUD_CONFIG_SYNC_CONFIRM_AND_SYNC') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { T as $T } from '@/i18n/index'
import {
  IPicGoCloudConfigSyncConflictChoice,
  type IPicGoCloudConfigSyncConflictItem,
  type IPicGoCloudConfigSyncResolution
} from '#/types/cloudConfigSync'

const props = defineProps<{
  modelValue: boolean
  conflicts: IPicGoCloudConfigSyncConflictItem[]
  confirmLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'abort'): void
  (e: 'confirm', resolution: IPicGoCloudConfigSyncResolution): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const selections = reactive<Record<string, IPicGoCloudConfigSyncConflictChoice | undefined>>({})

watch(() => props.conflicts, (next) => {
  // New conflict set: reset selections.
  Object.keys(selections).forEach((key) => {
    delete selections[key]
  })
  next.forEach((item) => {
    selections[item.path] = undefined
  })
}, { immediate: true })

const isConfirmDisabled = computed(() => {
  if (!props.conflicts.length) return true
  return props.conflicts.some(item => !selections[item.path])
})

const setChoice = (path: string, choice: IPicGoCloudConfigSyncConflictChoice) => {
  selections[path] = choice
}

const localBoxClass = (path: string) => {
  const selected = selections[path] === IPicGoCloudConfigSyncConflictChoice.LOCAL
  return selected
    ? 'border-[rgba(64,158,255,0.85)] bg-[rgba(64,158,255,0.12)]'
    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.12)] hover:border-[rgba(64,158,255,0.35)]'
}

const cloudBoxClass = (path: string) => {
  const selected = selections[path] === IPicGoCloudConfigSyncConflictChoice.CLOUD
  return selected
    ? 'border-[rgba(103,194,58,0.85)] bg-[rgba(103,194,58,0.12)]'
    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.12)] hover:border-[rgba(103,194,58,0.35)]'
}

const handleChooseAllLocal = () => {
  props.conflicts.forEach(item => {
    selections[item.path] = IPicGoCloudConfigSyncConflictChoice.LOCAL
  })
}

const handleChooseAllCloud = () => {
  props.conflicts.forEach(item => {
    selections[item.path] = IPicGoCloudConfigSyncConflictChoice.CLOUD
  })
}

const handleResetAll = () => {
  props.conflicts.forEach(item => {
    selections[item.path] = undefined
  })
}

const handleAbort = () => {
  emit('abort')
  visible.value = false
}

const handleConfirm = () => {
  const resolution: IPicGoCloudConfigSyncResolution = {}
  props.conflicts.forEach(item => {
    const choice = selections[item.path]
    if (choice) {
      resolution[item.path] = choice
    }
  })
  emit('confirm', resolution)
}

const formatValue = (value: unknown): string => {
  if (value === undefined) return $T('PICGO_CLOUD_CONFIG_SYNC_VALUE_UNDEFINED')
  try {
    return JSON.stringify(value, null, 2) ?? String(value)
  } catch (e) {
    return String(value)
  }
}
</script>
