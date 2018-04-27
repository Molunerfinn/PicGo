<template>
  <div id="picgo-setting">
    <el-row :gutter="16">
      <el-col :span="12" :offset="6">
        <div class="view-title">
          PicGo设置
        </div>
        <el-form
          label-width="120px"
          label-position="right"
          size="small"
        >
          <el-form-item
            label="设定快捷键"
          >
            <el-button type="primary" round size="mini">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="自定义链接格式"
          >
            <el-button type="primary" round size="mini">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="打开更新助手"
          >
            <el-switch
              v-model="form.updateHelper"
              active-text="开"
              inactive-text="关"
            ></el-switch>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script>
export default {
  name: 'picgo-setting',
  data () {
    return {
      form: {
        updateHelper: false
      }
    }
  }
}
</script>
<style lang='stylus'>
.el-message
  left 60%
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 20px auto
#picgo-setting
  .el-form
    label  
      line-height 32px
      padding-bottom 0
      color #eee
    .el-button-group
      width 100%
      .el-button
        width 50%
    .el-input__inner
      border-radius 19px
    .el-radio-group
      margin-left 25px
    .el-switch__label
      color #eee
      &.is-active
        color #409EFF
    .el-icon-question
      font-size 20px
      float right
      margin-top 9px
      color #eee
      cursor pointer
      transition .2s color ease-in-out
      &:hover
        color #409EFF
</style>