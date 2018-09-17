<template>
  <div id="plugin-view">
    <div class="view-title">
      插件设置
    </div>
    <el-row class="handle-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索npm上的PicGo插件"
        size="small"
      ></el-input>
    </el-row>
    <el-row :gutter="20" class="plugin-list">
      <el-col :span="12">
        <div class="plugin-item">
          <img class="plugin-item__logo" src="https://user-images.githubusercontent.com/12621342/33876119-85a5148e-df5f-11e7-8843-46224e595d52.png">
          <div class="plugin-item__content">
            <div class="plugin-item__name">
              Uploader-SMMS2
            </div>
            <div class="plugin-item__desc">
              saldfjlsajf,ajsldfjasljfk,asmfjsalkfjsakfmasldfjlsajf,ajsfdljsalfjslafdj
            </div>
            <div class="plugin-item__info-bar">
              <span class="plugin-item__author">
                XXXXXXXX
              </span>
              <span class="plugin-item__config">
                <i class="el-icon-setting"></i>
              </span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="plugin-item">
          
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script>
export default {
  name: 'plugin',
  data () {
    return {
      searchText: ''
    }
  }
}
</script>
<style lang='stylus'>
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
#plugin-view
  padding 0 20px 0
  .handle-bar
    margin-bottom 20px
  .el-input__inner
    border-radius 0
  .plugin-item
    box-sizing border-box
    height 80px
    background #444
    padding 8px
    user-select text
    transition all .2s ease-in-out
    cursor pointer
    &:hover
      background #333
    &__logo
      width 64px
      height 64px
      float left
    &__content
      float left
      width calc(100% - 74px)
      height 64px
      color #aaa
      margin-left 8px
      display flex
      flex-direction column
      justify-content space-between
    &__name
      font-size 16px
      height 22px
      line-height 22px
    &__desc
      font-size 14px
      height 21px
      line-height 21px
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__info-bar
      font-size 14px
      height 21px
      line-height 28px
    &__author
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
    &__config
      float right
      font-size 16px
</style>