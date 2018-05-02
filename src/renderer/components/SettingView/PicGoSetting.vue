<template>
  <div id="picgo-setting">
    <div class="view-title">
      PicGo设置
      <div class="sub-title">
        注意保存设置
      </div>
    </div>
    <el-row class="setting-list">
      <el-col :span="15" :offset="4">
        <el-row>
        <el-form
          label-width="120px"
          label-position="right"
          size="small"
        >
          <el-form-item
            label="修改快捷键"
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
          <el-form-item
            label="开机自启"
          >
            <el-switch
              v-model="form.autoStart"
              active-text="开"
              inactive-text="关"
            ></el-switch>
          </el-form-item>
          <el-form-item
            label="上传前重命名"
          >
            <el-switch
              v-model="form.rename"
              active-text="开"
              inactive-text="关"
            ></el-switch>
          </el-form-item>
          <el-form-item
            label="选择显示的图床"
          >
            <el-checkbox-group v-model="form.showPicBedList">
              <el-checkbox
                v-for="(item, index) in picBed"
                :label="item.name"
              ></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="" round class="confirm-button">保存设置</el-button>
          </el-form-item>
        </el-form>
        </el-row>
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
        updateHelper: false,
        showPicBedList: [],
        autoStart: false,
        rename: false
      },
      picBed: this.$picBed
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
  .sub-title
    font-size 14px
  .setting-list
    height 340px
    box-sizing border-box
    overflow-y auto
    overflow-x hidden
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
    .el-checkbox-group
      label
        margin-right 30px
        width 100px
    .el-checkbox+.el-checkbox
      margin-right 30px
      margin-left 0
    .confirm-button
      width 100%
</style>