<template>
  <div id="gallery-view">
    <div class="view-title">
      相册 - {{ filterList.length }} <i class="el-icon-caret-bottom" @click="toggleHandleBar" :class="{'active': handleBarActive}"></i>
    </div>
    <transition name="el-zoom-in-top">
      <el-row v-show="handleBarActive">
        <el-col :span="20" :offset="2">
          <el-row class="handle-bar" :gutter="16">
            <el-col :span="12">
              <el-select
                v-model="choosedPicBed"
                multiple
                collapse-tags
                size="mini"
                style="width: 100%"
                placeholder="请选择显示的图床">
                <el-option
                  v-for="item in picBed"
                  :key="item.type"
                  :label="item.name"
                  :value="item.type">
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select
                v-model="pasteStyle"
                size="mini"
                style="width: 100%"
                @change="handlePasteStyleChange"
                placeholder="请选择粘贴的格式">
                <el-option
                  v-for="(value, key) in pasteStyleMap"
                  :key="key"
                  :label="key"
                  :value="value">
                </el-option>
              </el-select>
            </el-col>
          </el-row>
          <el-row class="handle-bar" :gutter="16">
            <el-col :span="12">
              <el-input
                placeholder="搜索"
                size="mini"
                v-model="searchText">
                <i slot="suffix" class="el-input__icon el-icon-close" v-if="searchText" @click="cleanSearch" style="cursor: pointer"></i>
              </el-input>
            </el-col>
            <el-col :span="6">
              <div class="item-base copy round" :class="{ active: isMultiple(choosedList)}" @click="multiCopy">
                <i class="el-icon-document"></i> 批量复制
              </div>
            </el-col>
            <el-col :span="6">
              <div class="item-base delete round" :class="{ active: isMultiple(choosedList)}" @click="multiRemove">
                <i class="el-icon-delete"></i> 批量删除
              </div>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </transition>
    <el-row class="gallery-list" :class="{ small: handleBarActive }">
      <el-col :span="20" :offset="2">
        <el-row :gutter="16">
          <gallerys
            :images="images"
            :index="idx"
            @close="handleClose"
            :options="options"
          ></gallerys>
          <el-col :span="6" v-for="(item, index) in images" :key="item.id" class="gallery-list__img">
            <div 
              class="gallery-list__item"
              @click="zoomImage(index)"
            >
              <img v-lazy="item.imgUrl" class="gallery-list__item-img">
            </div>
            <div class="gallery-list__tool-panel">
              <i class="el-icon-document" @click="copy(item)"></i>
              <i class="el-icon-edit-outline" @click="openDialog(item)"></i>
              <i class="el-icon-delete" @click="remove(item.id)"></i>
              <el-checkbox v-model="choosedList[item.id]" class="pull-right" @change=" handleBarActive = true"></el-checkbox>
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
import pasteStyle from '~/main/utils/pasteTemplate'
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
      },
      choosedList: {},
      choosedPicBed: [],
      searchText: '',
      handleBarActive: false,
      pasteStyle: '',
      pasteStyleMap: {
        Markdown: 'markdown',
        HTML: 'HTML',
        URL: 'URL',
        UBB: 'UBB',
        Custom: 'Custom'
      },
      picBed: []
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.getGallery()
      vm.getPasteStyle()
      vm.getPicBeds()
    })
  },
  created () {
    this.$electron.ipcRenderer.on('updateGallery', (event) => {
      this.$nextTick(() => {
        this.filterList = this.getGallery()
      })
    })
    this.$electron.ipcRenderer.send('getPicBeds')
    this.$electron.ipcRenderer.on('getPicBeds', this.getPicBeds)
  },
  computed: {
    filterList: {
      get () {
        return this.getGallery()
      },
      set (val) {
        return this.val
      }
    }
  },
  methods: {
    getPicBeds (event, picBeds) {
      this.picBed = picBeds
    },
    getGallery () {
      if (this.choosedPicBed.length > 0) {
        let arr = []
        this.choosedPicBed.forEach(item => {
          let obj = {
            type: item
          }
          if (this.searchText) {
            obj.fileName = this.searchText
          }
          arr = arr.concat(this.$db.read().get('uploaded').filter(obj => {
            return obj.fileName.indexOf(this.searchText) !== -1 && obj.type === item
          }).reverse().value())
        })
        this.images = arr
      } else {
        if (this.searchText) {
          let data = this.$db.read().get('uploaded')
            .filter(item => {
              return item.fileName.indexOf(this.searchText) !== -1
            }).reverse().value()
          this.images = data
        } else {
          this.images = this.$db.read().get('uploaded').slice().reverse().value()
        }
      }
      return this.images
    },
    zoomImage (index) {
      this.idx = index
      this.changeZIndexForGallery(true)
    },
    changeZIndexForGallery (isOpen) {
      if (isOpen) {
        document.querySelector('.main-content.el-row').style.zIndex = 101
      } else {
        document.querySelector('.main-content.el-row').style.zIndex = 10
      }
    },
    handleClose () {
      this.idx = null
      this.changeZIndexForGallery(false)
    },
    copy (item) {
      const style = this.$db.get('settings.pasteStyle') || 'markdown'
      const copyLink = pasteStyle(style, item)
      const obj = {
        title: '复制链接成功',
        body: copyLink,
        icon: item.url || item.imgUrl
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
        const file = this.$db.get('uploaded').getById(id)
        this.$db.read().get('uploaded').removeById(id).write()
        this.$electron.ipcRenderer.send('removeFiles', [file])
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
    },
    choosePicBed (type) {
      let idx = this.choosedPicBed.indexOf(type)
      if (idx !== -1) {
        this.choosedPicBed.splice(idx, 1)
      } else {
        this.choosedPicBed.push(type)
      }
    },
    cleanSearch () {
      this.searchText = ''
    },
    isMultiple (obj) {
      return Object.values(obj).some(item => item)
    },
    multiRemove () {
      // choosedList -> { [id]: true or false }; true means choosed. false means not choosed.
      if (Object.values(this.choosedList).some(item => item)) {
        this.$confirm('将删除刚才选中的图片，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let files = []
          Object.keys(this.choosedList).forEach(key => {
            if (this.choosedList[key]) {
              const file = this.$db.read().get('uploaded').getById(key).value()
              files.push(file)
              this.$db.read().get('uploaded').removeById(key).write()
            }
          })
          this.choosedList = {}
          this.getGallery()
          const obj = {
            title: '操作结果',
            body: '删除成功'
          }
          this.$electron.ipcRenderer.send('removeFiles', files)
          const myNotification = new window.Notification(obj.title, obj)
          myNotification.onclick = () => {
            return true
          }
        }).catch(() => {
          return true
        })
      }
    },
    multiCopy () {
      if (Object.values(this.choosedList).some(item => item)) {
        let copyString = ''
        const style = this.$db.get('settings.pasteStyle') || 'markdown'
        // choosedList -> { [id]: true or false }; true means choosed. false means not choosed.
        Object.keys(this.choosedList).forEach(key => {
          if (this.choosedList[key]) {
            const item = this.$db.read().get('uploaded').getById(key).value()
            copyString += pasteStyle(style, item) + '\n'
            this.choosedList[key] = false
          }
        })
        const obj = {
          title: '批量复制链接成功',
          body: copyString
        }
        const myNotification = new window.Notification(obj.title, obj)
        this.$electron.clipboard.writeText(copyString)
        myNotification.onclick = () => {
          return true
        }
      }
    },
    toggleHandleBar () {
      this.handleBarActive = !this.handleBarActive
    },
    getPasteStyle () {
      this.pasteStyle = this.$db.get('settings.pasteStyle') || 'markdown'
    },
    handlePasteStyleChange (val) {
      this.$db.set('settings.pasteStyle', val)
      this.pasteStyle = val
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('updateGallery')
    this.$electron.ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
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
  .el-icon-caret-bottom
    cursor: pointer
    transition all .2s ease-in-out
    &.active
      transform: rotate(180deg)
#gallery-view
  height 100%
.item-base
  background #2E2E2E
  text-align center
  padding 5px 0
  cursor pointer
  font-size 13px
  transition all .2s ease-in-out
  height: 28px
  box-sizing: border-box
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
#gallery-view
  position relative
  .round
    border-radius 14px
  .pull-right
    float right
  .gallery-list
    height 360px
    box-sizing border-box
    padding 8px 0
    overflow-y auto
    overflow-x hidden
    position absolute
    top: 38px
    transition all .2s ease-in-out .1s
    width 100%
    &.small
      height: 287px
      top: 113px
    &__img
      height 150px
      position relative
      margin-bottom 16px
    &__item
      width 100%
      height 120px
      transition all .2s ease-in-out
      cursor pointer
      margin-bottom 8px
      overflow hidden
      display flex
      &-fake
        position absolute
        top 0
        left 0 
        opacity 0
        width 100%
        z-index -1
      &:hover
        transform scale(1.1)
      &-img
        width 100%
        object-fit fill
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
  .handle-bar
    color #ddd
    margin-bottom 10px
  .el-input__inner
    border-radius 14px
</style>