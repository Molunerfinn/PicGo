<template>
  <div id="gallery-view">
    <div class="view-title">
      相册
    </div>
    <el-row class="gallery-list">
      <el-col :span="20" :offset="2">
        <el-row :gutter="16">
          <gallerys
            :images="images"
            :index="idx"
            @close="handleClose"
            :options="options"
          ></gallerys>
          <el-col :span="6" v-for="(item, index) in images" :key="item.id">
            <div 
              class="gallery-list__item"
              :style="{ 'background-image': `url(${item.imgUrl})` }"
              @click="zoomImage(index)"
            >
            </div>
            <div class="gallery-list__tool-panel">
              <i class="el-icon-document" @click="copy(item.imgUrl)"></i>
              <i class="el-icon-edit-outline" @click="openDialog(item)"></i>
              <i class="el-icon-delete" @click="remove(item.id)"></i>
            </div> 
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="dialogVisible"
      title="修改图片URL"
      width="500px"
      :modal-append-to-body="false"
    >
      <el-input v-model="imgInfo.imgUrl"></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmModify">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import gallerys from 'vue-gallery'
import pasteStyle from '../../../main/utils/pasteTemplate'
export default {
  name: 'gallery',
  components: {
    gallerys
  },
  data () {
    return {
      images: [],
      idx: null,
      options: {
        titleProperty: 'fileName',
        urlProperty: 'imgUrl',
        closeOnSlideClick: true
      },
      dialogVisible: false,
      imgInfo: {
        id: null,
        imgUrl: ''
      }
    }
  },
  created () {
    this.getGallery()
  },
  methods: {
    getGallery () {
      this.images = this.$db.read().get('uploaded').slice().reverse().value()
    },
    zoomImage (index) {
      this.idx = index
    },
    handleClose () {
      this.idx = null
    },
    copy (url) {
      const style = this.$db.read().get('picBed.pasteStyle').value()
      const copyLink = pasteStyle(style, url)
      const obj = {
        title: '复制链接成功',
        body: copyLink,
        icon: url
      }
      const myNotification = new window.Notification(obj.title, obj)
      this.$electron.clipboard.writeText(copyLink)
      myNotification.onclick = () => {
        return true
      }
    },
    remove (id) {
      this.$confirm('此操作将把该图片移出相册, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$db.read().get('uploaded').removeById(id).write()
        const obj = {
          title: '操作结果',
          body: '删除成功'
        }
        const myNotification = new window.Notification(obj.title, obj)
        myNotification.onclick = () => {
          return true
        }
        this.getGallery()
      }).catch(() => {
        return true
      })
    },
    openDialog (item) {
      this.imgInfo.id = item.id
      this.imgInfo.imgUrl = item.imgUrl
      this.dialogVisible = true
    },
    confirmModify () {
      this.$db.read().get('uploaded')
        .getById(this.imgInfo.id)
        .assign({imgUrl: this.imgInfo.imgUrl})
        .write()
      const obj = {
        title: '修改图片URL成功',
        body: this.imgInfo.imgUrl,
        icon: this.imgInfo.imgUrl
      }
      const myNotification = new window.Notification(obj.title, obj)
      myNotification.onclick = () => {
        return true
      }
      this.dialogVisible = false
      this.getGallery()
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
  .sub-title
    font-size 14px
#gallery-view
  .gallery-list
    height 360px
    box-sizing border-box
    padding 8px 0
    overflow-y auto
    overflow-x hidden
    .el-col
      height 150px
      position relative
      margin-bottom 16px
    &__item
      width 100%
      height 120px
      background-size cover
      background-position 50% 50%
      background-repeat no-repeat
      transition all .2s ease-in-out
      cursor pointer
      margin-bottom 8px
      &-fake
        position absolute
        top 0
        left 0 
        opacity 0
        width 100%
        z-index -1
      &:hover
        background-color #49B1F5
        transform scale(1.1)
    &__tool-panel
      color #ddd
      i
        cursor pointer
        transition all .2s ease-in-out
        &.el-icon-document
          &:hover
            color #49B1F5
        &.el-icon-edit-outline
          &:hover
            color #69C282
        &.el-icon-delete
          &:hover
            color #F15140
  .blueimp-gallery
    .title
      top 30px
</style>