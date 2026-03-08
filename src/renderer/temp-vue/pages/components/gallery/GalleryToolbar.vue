<template>
  <el-col :span="12">
    <div class="w-full flex justify-between gap-x-[6px]">
      <div
        class="item-base copy round gap-x-[10px]"
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
      <div
        class="item-base select-more round !w-[18%]"
        :class="{ active: filterList.length > 0}"
        @click="$emit('selectMore')"
      >
        <el-icon name="el-icon-arrow-left">
          <MoreFilled />
        </el-icon>
      </div>
    </div>
    <ConfigFormDialog />
  </el-col>
</template>
<script lang="ts" setup>
import { T as $T } from '@/i18n'
import { MoreFilled } from '@element-plus/icons-vue'
import ConfigFormDialog from '@/components/dialog/ConfigFormDialog.vue'

interface IProps {
  selectedList: IObjT<boolean>
  filterList: IGalleryItem[]
  isAllSelected: boolean
}
defineProps<IProps>()

defineEmits(['multiCopy', 'multiRemove', 'toggleSelectAll', 'selectMore'])

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
.item-base
  background #2E2E2E
  text-align center
  width: 22%
  flex-grow: 1
  cursor pointer
  font-size 12px
  transition all .2s ease-in-out
  height: 24px
  line-height: 28px
  box-sizing: border-box
  display: flex
  align-items: center
  justify-content: center
  &.copy
    cursor not-allowed
    background #49B1F5
    &.active
      cursor pointer
      background #1B9EF3
      color #fff
  &.delete
    cursor not-allowed
    background #F47466
    &.active
      cursor pointer
      background #F15140
      color #fff
  &.all-pick
    cursor not-allowed
    background #69C282
    &.active
      cursor pointer
      background #44B363
      color #fff
  &.select-more
    cursor pointer
    background #858585
    color #fff
</style>
