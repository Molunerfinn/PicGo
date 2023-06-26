<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$T('SETTINGS_CHECK_UPDATE')"
    :append-to-body="true"
  >
    <div>
      {{ $T('SETTINGS_CURRENT_VERSION') }}: {{ version }}
    </div>
    <div>
      {{ $T('SETTINGS_NEWEST_VERSION') }}: {{ latestVersion ? latestVersion : `${$T('SETTINGS_GETING')}...` }}
    </div>
    <div v-if="needUpdate">
      {{ $T('SETTINGS_TIPS_HAS_NEW_VERSION') }}
    </div>
    <template #footer>
      <el-button
        size="default"
        round
        @click="cancelCheckVersion"
      >
        {{ $T('CANCEL') }}
      </el-button>
      <el-button
        size="default"
        type="primary"
        round
        @click="confirmCheckVersion"
      >
        {{ $T('CONFIRM') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { T as $T } from '@/i18n'
import { STABLE_RELEASE_URL, BETA_RELEASE_URL } from '#/utils/static'
import pkg from 'root/package.json'
import { compare } from 'compare-versions'
import { IRPCActionType } from '~/universal/types/enum'
import { useVModel } from '@/hooks/useVModel'
import { triggerRPC } from '@/utils/dataSender'
import { openURL } from '@/utils/common'

interface IProps {
  modelValue: boolean
  checkBetaUpdate: boolean
}

const props = defineProps<IProps>()

const dialogVisible = useVModel(props, 'modelValue')
const checkBetaUpdate = useVModel(props, 'checkBetaUpdate')

const version = pkg.version
const latestVersion = ref('')

function compareVersion2Update (current: string, latest: string): boolean {
  return compare(current, latest, '<')
}

const needUpdate = computed(() => {
  if (latestVersion.value) {
    return compareVersion2Update(version, latestVersion.value)
  } else {
    return false
  }
})

watch(() => dialogVisible.value, (value) => {
  if (value) {
    checkUpdate()
  }
})

async function checkUpdate () {
  const version = await triggerRPC<string>(IRPCActionType.GET_LATEST_VERSION, checkBetaUpdate.value)
  if (version) {
    latestVersion.value = version
  } else {
    latestVersion.value = $T('TIPS_NETWORK_ERROR')
  }
}

function confirmCheckVersion () {
  if (needUpdate.value) {
    openURL(checkBetaUpdate.value ? BETA_RELEASE_URL : STABLE_RELEASE_URL)
  }
  dialogVisible.value = false
}

function cancelCheckVersion () {
  latestVersion.value = ''
  dialogVisible.value = false
}

</script>
<script lang="ts">
export default {
  name: 'CheckUpdateDialog'
}
</script>
<style lang='stylus'>
</style>
