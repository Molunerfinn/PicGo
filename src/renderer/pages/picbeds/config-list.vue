<template>
  <div id="config-list-view">
    <el-row :gutter="20" align="middle" class="config-list">
      <el-col
        class="config-item-col"
        v-for="item in 5"
        :key="item"
        :span="11"
        :offset="1"
      >
        <div
          :class="`config-item ${activeItem === item ? 'selected' : ''}`"
          @click="() => selectItem(item)"
        >
          <div class="config-name">配置名</div>
          <div class="config-update-time">更新时间</div>
          <div class="operation-container">
            <i class="el-icon-edit"></i>
            <i class="el-icon-delete"></i>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
// import {
//   ipcRenderer,
//   IpcRendererEvent
// } from 'electron'
// import { trimValues } from '@/utils/common'

@Component({
  name: 'OssConfigList'
})
export default class extends Vue {
  activeItem = 1;

  selectItem (id: number) {
    this.activeItem = id
  }
}
</script>
<style lang='stylus'>
#config-list-view
  .config-list
    .config-item
      height 80px
      margin-bottom 20px
      border-radius 4px
      cursor pointer
      box-sizing border-box
      padding 8px
      background rgba(130, 130, 130, .2)
      border 1px solid transparent
      box-shadow 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)
      position relative
      .config-name
        color #eee
        font-size 16px
      .config-update-time
        color #aaa
        font-size 14px
        margin-top 10px
      .operation-container
        position absolute
        right: 5px
        top: 8px
        font-size: 18pxc
        color #eee
        .el-icon-edit
        .el-icon-delete
          cursor pointer
        .el-icon-edit
          margin-right: 10px
    .selected
      border 1px solid #409EFF
</style>
