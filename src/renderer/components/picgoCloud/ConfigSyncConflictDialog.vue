<template>
  <el-dialog
    v-model="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="picgo-cloud-config-sync-conflict-dialog"
    width="80%"
    top="6vh"
    append-to-body
    lock-scroll
    header-class="!px-[20px] !pt-[18px] !pb-[14px] !m-0 border-b border-slate-100"
    body-class="!p-0 overflow-hidden"
    footer-class="!px-[20px] !py-[16px] border-t border-slate-100"
  >
    <template #header>
      <div class="flex items-start justify-between gap-[16px]">
        <div class="min-w-0">
          <div class="flex items-center gap-[8px]">
            <el-icon>
              <WarningFilled class="text-[20px] text-orange-500" />
            </el-icon>
            <div class="text-[20px] font-semibold text-slate-800 leading-[22px]">
              {{ $T('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_TITLE', { count: conflicts.length }) }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-[10px] flex-shrink-0">
          <el-button
            size="small"
            round
            @click="handleResetAll"
          >
            <el-icon class="mr-1">
              <RefreshLeft />
            </el-icon>
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_RESET_ALL') }}
          </el-button>
          <el-button-group>
            <el-button
              size="small"
              round
              @click="handleChooseAllLocal"
            >
              {{ $T('PICGO_CLOUD_CONFIG_SYNC_CHOOSE_ALL_LOCAL') }}
            </el-button>
            <el-button
              size="small"
              round
              @click="handleChooseAllCloud"
            >
              {{ $T('PICGO_CLOUD_CONFIG_SYNC_CHOOSE_ALL_CLOUD') }}
            </el-button>
          </el-button-group>
        </div>
      </div>
      <div class="mt-[4px] text-[12px] text-slate-500 leading-[18px]">
        {{ $T('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_DETECTED') }}
      </div>
    </template>

    <!-- Conflict List -->
    <div>
      <div class="h-full overflow-y-auto px-[20px] pt-[16px] pb-[24px] picgo-cloud-conflict-list">
        <div
          v-for="item in conflicts"
          :key="item.path"
          class="mb-[16px] last:mb-0 rounded-[12px] border-2 bg-white shadow-[0_1px_6px_rgba(15,23,42,0.10)] transition-colors duration-200 overflow-hidden"
          :class="getCardBorderClass(item.path)"
        >
          <!-- Card Header -->
          <div class="bg-slate-100/80 px-[16px] py-[10px] border-b border-slate-200 flex justify-between items-center gap-[12px]">
            <div class="min-w-0 flex items-center gap-2">
              <el-icon class="text-slate-500">
                <Operation />
              </el-icon>
              <span class="font-mono font-medium text-[12px] text-slate-700 leading-[16px] break-all">
                {{ item.path }}
              </span>
            </div>
            <div
              v-if="selections[item.path]"
              class="px-[10px] py-[4px] rounded-full text-[12px] font-medium flex items-center gap-1 shrink-0 border"
              :class="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.LOCAL
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-purple-100 text-purple-700 border-purple-200'"
            >
              <el-icon class="text-[14px]">
                <Check />
              </el-icon>
              {{ selections[item.path] === IPicGoCloudConfigSyncConflictChoice.LOCAL
                ? $T('PICGO_CLOUD_CONFIG_SYNC_LOCAL_VERSION')
                : $T('PICGO_CLOUD_CONFIG_SYNC_CLOUD_VERSION') }}
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-[16px]">
            <div class="grid grid-cols-[1fr_auto_1fr] gap-[12px] items-stretch">
              <!-- Local Option -->
              <div
                class="relative cursor-pointer rounded-[8px] p-[16px] border-2 transition-all duration-200 group flex flex-col"
                :class="localBoxClass(item.path)"
                @click="setChoice(item.path, IPicGoCloudConfigSyncConflictChoice.LOCAL)"
              >
                <div
                  class="flex items-center gap-[8px] mb-[8px] font-semibold text-[14px]"
                  :class="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.LOCAL ? 'text-blue-600' : 'text-gray-600'"
                >
                  <el-icon class="text-[16px]">
                    <Monitor />
                  </el-icon>
                  <span>{{ $T('PICGO_CLOUD_CONFIG_SYNC_LOCAL_VERSION') }}</span>
                </div>
                <div class="font-mono text-[13px] text-slate-800 break-words leading-relaxed whitespace-pre-wrap">
                  {{ formatValue(item.localValue) }}
                </div>
                <div
                  v-if="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.LOCAL"
                  class="absolute top-[12px] right-[12px] text-blue-500"
                >
                  <el-icon class="text-[20px]">
                    <Check />
                  </el-icon>
                </div>
              </div>

              <!-- Middle Indicator -->
              <div class="flex flex-col items-center justify-center w-[40px]">
                <el-icon
                  v-if="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.LOCAL"
                  class="text-[24px] text-blue-500"
                >
                  <ArrowLeft />
                </el-icon>
                <el-icon
                  v-else-if="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.CLOUD"
                  class="text-[24px] text-purple-500"
                >
                  <ArrowRight />
                </el-icon>
                <div
                  v-else
                  class="w-[2px] h-full bg-gray-100 rounded-full my-2"
                />
              </div>

              <!-- Cloud Option -->
              <div
                class="relative cursor-pointer rounded-[8px] p-[16px] border-2 transition-all duration-200 group flex flex-col"
                :class="cloudBoxClass(item.path)"
                @click="setChoice(item.path, IPicGoCloudConfigSyncConflictChoice.CLOUD)"
              >
                <div
                  class="flex items-center gap-[8px] mb-[8px] font-semibold text-[14px]"
                  :class="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.CLOUD ? 'text-purple-600' : 'text-gray-600'"
                >
                  <el-icon class="text-[16px]">
                    <Cloudy />
                  </el-icon>
                  <span>{{ $T('PICGO_CLOUD_CONFIG_SYNC_CLOUD_VERSION') }}</span>
                </div>
                <div class="font-mono text-[13px] text-slate-800 break-words leading-relaxed whitespace-pre-wrap">
                  {{ formatValue(item.remoteValue) }}
                </div>
                <div
                  v-if="selections[item.path] === IPicGoCloudConfigSyncConflictChoice.CLOUD"
                  class="absolute top-[12px] right-[12px] text-purple-500"
                >
                  <el-icon class="text-[20px]">
                    <Check />
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-[13px] text-gray-500 mr-[20px] text-left">
          <span
            v-if="remainingCount > 0"
          >
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_CONFLICT_PENDING') }}
            <span class="font-bold text-orange-500 ml-1">{{ remainingCount }}</span>
          </span>
          <span
            v-else
            class="text-green-600 flex items-center gap-1"
          >
            <el-icon class="text-[14px]">
              <SuccessFilled />
            </el-icon>
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_SUCCESS') }}
          </span>
        </div>
        <div class="flex items-center gap-[12px]">
          <el-button
            round
            plain
            :disabled="confirmLoading"
            @click="handleAbort"
          >
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_ABORT') }}
          </el-button>
          <el-button
            type="primary"
            round
            :loading="confirmLoading"
            :disabled="isConfirmDisabled || confirmLoading"
            @click="handleConfirm"
          >
            {{ $T('PICGO_CLOUD_CONFIG_SYNC_CONFIRM_AND_SYNC') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { T as $T } from '@/i18n/index'
import {
  IPicGoCloudConfigSyncConflictChoice,
  type IPicGoCloudConfigSyncConflictItem,
  type IPicGoCloudConfigSyncResolution
} from '#/types/cloudConfigSync'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloudy,
  Monitor,
  Operation,
  RefreshLeft,
  SuccessFilled,
  WarningFilled
} from '@element-plus/icons-vue'

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

type IScrollLockRecord = {
  el: HTMLElement
  previousOverflow: string
}

const scrollLockRecords: IScrollLockRecord[] = []

const lockPageScroll = () => {
  if (typeof document === 'undefined') return
  if (scrollLockRecords.length > 0) return

  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.body,
    document.getElementById('main-page'),
    document.querySelector<HTMLElement>('.main-wrapper')
  ]

  targets.forEach((el) => {
    if (!el) return
    scrollLockRecords.push({
      el,
      previousOverflow: el.style.overflow
    })
    el.style.overflow = 'hidden'
  })
}

const unlockPageScroll = () => {
  if (scrollLockRecords.length === 0) return
  scrollLockRecords.forEach(({ el, previousOverflow }) => {
    el.style.overflow = previousOverflow
  })
  scrollLockRecords.length = 0
}

watch(visible, (nextVisible) => {
  if (nextVisible) {
    lockPageScroll()
    return
  }
  unlockPageScroll()
}, { immediate: true })

onBeforeUnmount(() => {
  unlockPageScroll()
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

const remainingCount = computed(() => {
  return props.conflicts.filter(item => !selections[item.path]).length
})

const setChoice = (path: string, choice: IPicGoCloudConfigSyncConflictChoice) => {
  selections[path] = choice
}

const getCardBorderClass = (path: string) => {
  const choice = selections[path]
  if (!choice) return 'border-slate-300'
  return choice === IPicGoCloudConfigSyncConflictChoice.LOCAL ? 'border-blue-300' : 'border-purple-300'
}

const localBoxClass = (path: string) => {
  const selected = selections[path] === IPicGoCloudConfigSyncConflictChoice.LOCAL
  return selected
    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-100'
}

const cloudBoxClass = (path: string) => {
  const selected = selections[path] === IPicGoCloudConfigSyncConflictChoice.CLOUD
  return selected
    ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
    : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-gray-100'
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

<style scoped>
.picgo-cloud-conflict-list::-webkit-scrollbar {
  width: 6px;
}
.picgo-cloud-conflict-list::-webkit-scrollbar-track {
  background: transparent;
}
.picgo-cloud-conflict-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
.picgo-cloud-conflict-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>
