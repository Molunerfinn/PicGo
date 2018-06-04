<template>
  <div id="picgo-setting">
    <div class="view-title">
      PicGo设置
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
            <el-button type="primary" round size="mini" @click="keyBindingVisible = true">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="自定义链接格式"
          >
            <el-button type="primary" round size="mini" @click="customLinkVisible = true">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="检查更新"
          >
            <el-button type="primary" round size="mini" @click="checkUpdate">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="打开更新助手"
          >
            <el-switch
              v-model="form.updateHelper"
              active-text="开"
              inactive-text="关"
              @change="updateHelperChange"
            ></el-switch>
          </el-form-item>
          <el-form-item
            label="开机自启"
          >
            <el-switch
              v-model="form.autoStart"
              active-text="开"
              inactive-text="关"
              @change="handleAutoStartChange"
            ></el-switch>
          </el-form-item>
          <el-form-item
            label="上传前重命名"
          >
            <el-switch
              v-model="form.rename"
              active-text="开"
              inactive-text="关"
              @change="handleRename"
            ></el-switch>
          </el-form-item>
          <el-form-item
            label="时间戳重命名"
          >
            <el-switch
              v-model="form.autoRename"
              active-text="开"
              inactive-text="关"
              @change="handleAutoRename"
            ></el-switch>
          </el-form-item>
          <el-form-item
            label="选择显示的图床"
          >
            <el-checkbox-group
              v-model="form.showPicBedList"
              @change="handleShowPicBedListChange"
            >
              <el-checkbox
                v-for="item in picBed"
                :label="item.name"
                :key="item.name"
              ></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
        </el-row>
      </el-col>
    </el-row>
    <el-dialog
      title="修改快捷键"
      :visible.sync="keyBindingVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-width="80px"
      >
        <el-form-item
          label="快捷上传"
        >
          <el-input 
            class="align-center"
            @keydown.native.prevent="keyDetect('upload', $event)"
            v-model="shortKey.upload"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelKeyBinding">取消</el-button>
        <el-button type="primary" @click="confirmKeyBinding">确定</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="自定义链接格式"
      :visible.sync="customLinkVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="top"
        :model="customLink"
        ref="customLink"
        :rules="rules"
      >
        <el-form-item
          label="用占位符$url来表示url的位置"
          prop="value"
        >
          <el-input 
            class="align-center"
            v-model="customLink.value"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <div>
        如[]($url)
      </div>
      <span slot="footer">
        <el-button @click="cancelCustomLink">取消</el-button>
        <el-button type="primary" @click="confirmCustomLink">确定</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="检查更新"
      :visible.sync="checkUpdateVisible"
      :modal-append-to-body="false"
    >
      <div>
        当前版本：{{ version }}
      </div>
      <div>
        最新版本：{{ latestVersion ? latestVersion : '正在获取中...' }}
      </div>
      <div v-if="needUpdate">
        PicGo更新啦，请点击确定打开下载页面
      </div>
      <span slot="footer">
        <el-button @click="cancelCheckVersion">取消</el-button>
        <el-button type="primary" @click="confirmCheckVersion">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import db from '../../../datastore'
import keyDetect from 'utils/key-binding'
import pkg from '../../../../package.json'
const release = 'https://api.github.com/repos/Molunerfinn/PicGo/releases/latest'
const downloadUrl = 'https://github.com/Molunerfinn/PicGo/releases/latest'
export default {
  name: 'picgo-setting',
  computed: {
    needUpdate () {
      if (this.latestVersion) {
        return this.compareVersion2Update(this.version, this.latestVersion)
      } else {
        return false
      }
    }
  },
  data () {
    const customLinkRule = (rule, value, callback) => {
      if (!/\$url/.test(value)) {
        return callback(new Error('必须含有$url'))
      } else {
        return callback()
      }
    }
    return {
      form: {
        updateHelper: this.$db.get('picBed.showUpdateTip').value(),
        showPicBedList: [],
        autoStart: this.$db.get('picBed.autoStart').value() || false,
        rename: this.$db.get('picBed.rename').value() || false,
        autoRename: this.$db.get('picBed.autoRename').value() || false
      },
      picBed: this.$picBed,
      keyBindingVisible: false,
      customLinkVisible: false,
      checkUpdateVisible: false,
      customLink: {
        value: db.read().get('customLink').value() || '$url'
      },
      shortKey: {
        upload: db.read().get('shortKey.upload').value()
      },
      rules: {
        value: [
          { validator: customLinkRule, trigger: 'blur' }
        ]
      },
      version: pkg.version,
      latestVersion: ''
    }
  },
  created () {
    this.form.showPicBedList = this.picBed.map(item => {
      if (item.visible) {
        return item.name
      }
    })
  },
  methods: {
    keyDetect (type, event) {
      this.shortKey[type] = keyDetect(event).join('+')
    },
    cancelKeyBinding () {
      this.keyBindingVisible = false
      this.shortKey = db.read().get('shortKey').value()
    },
    confirmKeyBinding () {
      const oldKey = db.read().get('shortKey').value()
      db.read().set('shortKey', this.shortKey).write()
      this.keyBindingVisible = false
      this.$electron.ipcRenderer.send('updateShortKey', oldKey)
    },
    cancelCustomLink () {
      this.customLinkVisible = false
      this.customLink.value = db.read().get('customLink').value() || '$url'
    },
    confirmCustomLink () {
      this.$refs.customLink.validate((valid) => {
        if (valid) {
          db.read().set('customLink', this.customLink.value).write()
          this.customLinkVisible = false
          this.$electron.ipcRenderer.send('updateCustomLink')
        } else {
          return false
        }
      })
    },
    updateHelperChange (val) {
      this.$db.read().set('picBed.showUpdateTip', val).write()
    },
    handleShowPicBedListChange (val) {
      const list = this.picBed.map(item => {
        if (!val.includes(item.name)) {
          item.visible = false
        } else {
          item.visible = true
        }
        return item
      })
      this.$db.read().set('picBed.list', list).write()
    },
    handleAutoStartChange (val) {
      this.$db.read().set('picBed.autoStart', val).write()
      this.$electron.ipcRenderer.send('autoStart', val)
    },
    handleRename (val) {
      this.$db.read().set('picBed.rename', val).write()
    },
    handleAutoRename (val) {
      this.$db.read().set('picBed.autoRename', val).write()
    },
    compareVersion2Update (current, latest) {
      const currentVersion = current.split('.').map(item => parseInt(item))
      const latestVersion = latest.split('.').map(item => parseInt(item))

      for (let i = 0; i < 3; i++) {
        if (currentVersion[i] < latestVersion[i]) {
          return true
        }
        if (currentVersion[i] > latestVersion[i]) {
          return false
        }
      }
      return false
    },
    checkUpdate () {
      this.checkUpdateVisible = true
      this.$http.get(release)
        .then(res => {
          this.latestVersion = res.data.name
        }).catch(err => {
          console.log(err)
        })
    },
    confirmCheckVersion () {
      if (this.needUpdate) {
        this.$electron.remote.shell.openExternal(downloadUrl)
      }
      this.checkUpdateVisible = false
    },
    cancelCheckVersion () {
      this.checkUpdateVisible = false
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('autoStart')
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
    height 360px
    box-sizing border-box
    overflow-y auto
    overflow-x hidden
  .setting-list
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