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
              排查 PicGo 运行时问题
            </el-row>
            <el-row class="toolbox-header__sub-title">
              立即扫描以下项目，修复使用问题
            </el-row>
          </el-row>
        </el-row>
        <el-row>
          <el-button
            type="primary"
            round
          >
            开始扫描
          </el-button>
        </el-row>
      </el-row>
    </el-row>
    <el-row class="progress">
      <el-progress
        :percentage="progress"
        :format="format"
      />
    </el-row>
    <el-collapse accordion>
      <el-collapse-item
        v-for="item in fixList"
        :key="item.id"
        :title="item.title"
      >
        123
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { IToolboxItemType } from '~/universal/types/enum'
// import { T as $T } from '@/i18n'
const defaultLogo = ref(`file://${__static.replace(/\\/g, '/')}/roundLogo.png`)
const fixList = ref<IToolboxItem[]>([
  {
    id: IToolboxItemType.IS_CONFIG_FILE_BROKEN,
    title: '检查配置文件是否损坏',
    status: 'init'
  },
  {
    id: IToolboxItemType.IS_GALLERY_FILE_BROKEN,
    title: '检查相册文件是否损坏',
    status: 'init'
  },
  {
    id: IToolboxItemType.HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD,
    title: '检查剪贴板图片上传是否存在问题',
    status: 'init'
  },
  {
    id: IToolboxItemType.HAS_PROBLEM_WITH_PROXY,
    title: '检查代理设置是否正常',
    status: 'init'
  }
])
const progress = ref(0)

const format = (percentage: number) => ''

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
</style>
