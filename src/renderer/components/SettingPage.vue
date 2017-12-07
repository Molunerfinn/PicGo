<template>
  <div id="setting-page">
    <div class="fake-title-bar">
      PicGo
    </div>
    <el-row style="padding-top: 22px;">
      <el-col :span="5">
        <el-menu
          class="picgo-sidebar"
          :default-active="defaultActive"
          @select="handleSelect"
          >
          <el-menu-item index="upload">
            <i class="el-icon-upload"></i>
            <span slot="title">上传区</span>
          </el-menu-item>
          <el-menu-item index="gallery">
            <i class="el-icon-picture"></i>
            <span slot="title">相册</span>
          </el-menu-item>
          <el-menu-item index="weibo">
            <i class="el-icon-ui-weibo"></i>
            <span slot="title">微博设置</span>
          </el-menu-item>
          <el-menu-item index="qiniu">
            <i class="el-icon-ui-qiniu"></i>
            <span slot="title">七牛设置</span>
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col :span="19" :offset="5">
        <router-view></router-view>
      </el-col>
    </el-row> 
  </div>
</template>
<script>
export default {
  name: 'setting-page',
  data () {
    return {
      defaultActive: 'upload'
    }
  },
  methods: {
    handleSelect (index) {
      this.$router.push({
        name: index
      })
    }
  },
  beforeRouteEnter: (to, from, next) => {
    next(vm => {
      vm.defaultActive = to.name
    })
  }
}
</script>
<style lang='stylus'>
#setting-page
  .fake-title-bar
    -webkit-app-region drag
    height h = 22px
    width 100%
    text-align center
    color #eee
    font-size 12px
    line-height h
    position fixed
  .picgo-sidebar
    height calc(100vh - 22px)
  .el-menu
    border-right none
    background transparent
    position fixed
    &-item
      color #eee
      position relative
      &:focus,
      &:hover
        color #fff
        background transparent
      &.is-active
        color active-color = #409EFF
        &:before
          content ''
          position absolute
          width 3px 
          height 20px
          right 0
          top 18px
          background active-color
</style>