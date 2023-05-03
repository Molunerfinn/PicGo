<template>
  <div class="toolbox">
    <el-row>
      <el-row
        class="toolbox-header"
      >
        <el-row>
          <img
            class="toolbox-header__logo"
            :src="defaultLogo"
          >
          <el-row class="toolbox-header__text">
            <el-row class="toolbox-header__title">
              {{ $T('TOOLBOX_TITLE') }}
            </el-row>
            <el-row class="toolbox-header__sub-title">
              {{ $T('TOOLBOX_SUB_TITLE') }}
            </el-row>
          </el-row>
        </el-row>
        <el-row>
          <template v-if="progress !== 100">
            <el-button
              type="primary"
              round
              :disabled="isLoading"
              @click="handleCheck"
            >
              {{ $T('TOOLBOX_START_SCAN') }}
            </el-button>
          </template>
          <template v-else-if="isAllSuccess">
            <div class="toolbox-tips">
              {{ $T('TOOLBOX_SUCCESS_TIPS') }}
            </div>
          </template>
          <template v-else-if="!isAllSuccess">
            <template v-if="canFixLength !== 0">
              <el-button
                type="primary"
                round
                @click="handleFix"
              >
                {{ $T('TOOLBOX_START_FIX') }}
              </el-button>
            </template>
            <template v-else>
              <div class="toolbox-cant-fix toolbox-tips">
                {{ $T('TOOLBOX_CANT_AUTO_FIX') }}
                <el-button
                  type="primary"
                  round
                  class="toolbox-cant-fix__btn"
                  @click="handleCheck"
                >
                  {{ $T('TOOLBOX_RE_SCAN') }}
                </el-button>
              </div>
            </template>
          </template>
        </el-row>
      </el-row>
    </el-row>
    <el-row class="progress">
      <el-progress
        :percentage="progress"
        :format="format"
      />
    </el-row>
    <el-collapse
      v-model="activeTypes"
      accordion
    >
      <el-collapse-item
        v-for="(item, key) in fixList"
        :key="key"
        :name="key"
      >
        <template #title>
          {{ item.title }} <toolbox-status-icon :status="item.status" />
        </template>
        <div class="toolbox-item-msg">
          {{ item.msg || '' }}
          <template v-if="item.handler && item.handlerText && item.value">
            <toolbox-handler
              :value="item.value"
              :status="item.status"
              :handler="item.handler"
              :handler-text="item.handlerText"
            />
          </template>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script lang="ts" setup>
import { useIPC } from '@/hooks/useIPC'
import { sendRPC, triggerRPC } from '@/utils/dataSender'
import { ElMessageBox } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { IToolboxItemType, IToolboxItemCheckStatus, IRPCActionType } from '~/universal/types/enum'
import { T as $T } from '@/i18n'
import ToolboxStatusIcon from '@/components/ToolboxStatusIcon.vue'
import ToolboxHandler from '@/components/ToolboxHandler.vue'

const $confirm = ElMessageBox.confirm
const defaultLogo = ref(`file://${__static.replace(/\\/g, '/')}/roundLogo.png`)
const activeTypes = ref<IToolboxItemType[]>([])
const fixList = reactive<IToolboxMap>({
  [IToolboxItemType.IS_CONFIG_FILE_BROKEN]: {
    title: $T('TOOLBOX_CHECK_CONFIG_FILE_BROKEN'),
    status: IToolboxItemCheckStatus.INIT,
    handlerText: $T('SETTINGS_OPEN_CONFIG_FILE'),
    handler (value: string) {
      sendRPC(IRPCActionType.OPEN_FILE, value)
    }
  },
  [IToolboxItemType.IS_GALLERY_FILE_BROKEN]: {
    title: $T('TOOLBOX_CHECK_GALLERY_FILE_BROKEN'),
    status: IToolboxItemCheckStatus.INIT
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD]: {
    title: $T('TOOLBOX_CHECK_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD'), // picgo-image-clipboard folder
    status: IToolboxItemCheckStatus.INIT,
    handlerText: $T('OPEN_FILE_PATH'),
    handler (value: string) {
      sendRPC(IRPCActionType.OPEN_FILE, value)
    }
  },
  [IToolboxItemType.HAS_PROBLEM_WITH_PROXY]: {
    title: $T('TOOLBOX_CHECK_PROBLEM_WITH_PROXY'),
    status: IToolboxItemCheckStatus.INIT,
    hasNoFixMethod: true
  }
})

const progress = computed(() => {
  const total = Object.keys(fixList).length
  const done = Object.keys(fixList).filter(key => {
    const status = fixList[key as IToolboxItemType].status
    return status !== IToolboxItemCheckStatus.INIT && status !== IToolboxItemCheckStatus.LOADING
  }).length
  return done / total * 100
})

const isAllSuccess = computed(() => {
  return Object.keys(fixList).every(key => {
    const status = fixList[key as IToolboxItemType].status
    return status === IToolboxItemCheckStatus.SUCCESS
  })
})

const isLoading = computed(() => {
  return Object.keys(fixList).some(key => {
    const status = fixList[key as IToolboxItemType].status
    return status === IToolboxItemCheckStatus.LOADING
  })
})

const canFixLength = computed(() => {
  return Object.keys(fixList).filter(key => {
    const status = fixList[key as IToolboxItemType].status
    return status === IToolboxItemCheckStatus.ERROR && !fixList[key as IToolboxItemType].hasNoFixMethod
  }).length
})

const format = (percentage: number) => ''

const ipc = useIPC()

ipc.on(IRPCActionType.TOOLBOX_CHECK_RES, (event, { type, msg = '', status, value = '' }: IToolboxCheckRes) => {
  fixList[type].status = status
  fixList[type].msg = msg
  fixList[type].value = value
  if (status === IToolboxItemCheckStatus.ERROR) {
    activeTypes.value.push(type)
  }
})

const handleCheck = () => {
  activeTypes.value = []
  Object.keys(fixList).forEach(key => {
    fixList[key as IToolboxItemType].status = IToolboxItemCheckStatus.LOADING
    fixList[key as IToolboxItemType].msg = ''
    fixList[key as IToolboxItemType].value = ''
  })
  sendRPC(IRPCActionType.TOOLBOX_CHECK)
}

const handleFix = async () => {
  const fixRes = await Promise.all(Object.keys(fixList).filter(key => {
    const status = fixList[key as IToolboxItemType].status
    return status === IToolboxItemCheckStatus.ERROR && !fixList[key as IToolboxItemType].hasNoFixMethod
  }).map(async key => {
    return triggerRPC<IToolboxCheckRes>(IRPCActionType.TOOLBOX_CHECK_FIX, key as IToolboxItemType)
  }))

  fixRes.filter(item => item !== null).forEach(item => {
    if (item) {
      fixList[item.type].status = item.status
      fixList[item.type].msg = item.msg
      fixList[item.type].value = item.value
    }
  })

  $confirm($T('TOOLBOX_FIX_DONE_NEED_RELOAD'), $T('TIPS_NOTICE'), {
    confirmButtonText: $T('CONFIRM'),
    cancelButtonText: $T('CANCEL'),
    type: 'info'
  }).then(() => {
    sendRPC(IRPCActionType.RELOAD_APP)
  }).catch(() => {})
}

</script>
<script lang="ts">
export default {
  name: 'ToolBoxPage'
}
</script>
<style lang='stylus'>
.toolbox
  padding 0 40px
  &-header
    width 100%
    color #eee
    justify-content space-between
    align-items center
    padding 20px 0px
    &__logo
      width 64px
      height 64px
      margin-right 20px
    &__text
      flex-direction column
      justify-content center
    &__title
      color #ddd
      font-size 20px
      margin-bottom 4px
    &__sub-title
      color #aaa
      font-size 16px
  .progress
    width 100%
    .el-progress--line
      width 100%
    .el-progress__text
      min-width 0
  .el-collapse
    margin-top 20px
    --el-collapse-border-color: #777;
    --el-collapse-header-height: 48px;
    --el-collapse-header-bg-color: transparent;
    --el-collapse-header-text-color: #ddd;
    --el-collapse-header-font-size: 13px;
    --el-collapse-content-bg-color: transparent;
    --el-collapse-content-font-size: 13px;
    --el-collapse-content-text-color: #ddd;
    &-item__content
      padding-bottom: 12px
  &-item-msg
    color: #aaa
  &-tips
    padding: 12px 0
  &-cant-fix
    display flex
    justify-content center
    align-items center
    &__btn
      margin-left: 8px
</style>
