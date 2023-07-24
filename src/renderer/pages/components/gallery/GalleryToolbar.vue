<template>
  <el-col :span="12">
    <div class="w-full flex gap-x-[4px]">
      <div
        class="item-base copy round"
        :class="{ active: isMultiple(selectedList)}"
        @click="$emit('multiCopy')"
      >
        {{ $T('COPY') }}
      </div>
      <div
        class="item-base delete round"
        :class="{ active: isMultiple(selectedList)}"
        @click="$emit('multiRemove')"
      >
        {{ $T('DELETE') }}
      </div>
      <div
        class="item-base all-pick round"
        :class="{ active: filterList.length > 0}"
        @click="$emit('toggleSelectAll')"
      >
        {{ isAllSelected ? $T('CANCEL') : $T('SELECT_ALL') }}
      </div>
    </div>
  </el-col>
</template>
<script lang="ts" setup>
import { T as $T } from '@/i18n'

interface IProps {
  selectedList: IObjT<boolean>
  filterList: IGalleryItem[]
  isAllSelected: boolean
}
defineProps<IProps>()

defineEmits(['multiCopy', 'multiRemove', 'toggleSelectAll'])

function isMultiple (obj: IObj) {
  return Object.values(obj).some(item => item)
}

</script>
<script lang="ts">
export default {
  name: 'GalleryToolbar'
}
</script>
<style lang='stylus'>
</style>
