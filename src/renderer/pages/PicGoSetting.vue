<template>
  <div id="picgo-setting">
    <div class="view-title">
      PicGo设置 - <i class="el-icon-document" @click="goConfigPage"></i>
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
            label="打开配置文件"
          >
            <el-button type="primary" round size="mini" @click="openFile('data.json')">点击打开</el-button>
          </el-form-item>
          <el-form-item
            label="设置日志文件"
          >
            <el-button type="primary" round size="mini" @click="openLogSetting">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="修改快捷键"
          >
            <el-button type="primary" round size="mini" @click="goShortCutPage">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="自定义链接格式"
          >
            <el-button type="primary" round size="mini" @click="customLinkVisible = true">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="设置代理"
          >
            <el-button type="primary" round size="mini" @click="proxyVisible = true">点击设置</el-button>
          </el-form-item>
          <el-form-item
            label="检查更新"
          >
            <el-button type="primary" round size="mini" @click="checkUpdate">点击检查</el-button>
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
            label="开启上传提示"
          >
            <el-switch
              v-model="form.uploadNotification"
              active-text="开"
              inactive-text="关"
              @change="handleUploadNotification"
            ></el-switch>
          </el-form-item>
          <el-form-item
            v-if="os !== 'darwin'"
            label="Mini窗口置顶"
          >
            <el-switch
              v-model="form.miniWindowOntop"
              active-text="开"
              inactive-text="关"
              @change="handleMiniWindowOntop"
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
      title="自定义链接格式"
      :visible.sync="customLinkVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="top"
        :model="customLink"
        ref="customLink"
        :rules="rules"
        size="small"
      >
        <el-form-item
          prop="value"
        >
          <div class="custom-title">
            用占位符 <b>$url</b> 来表示url的位置
          </div>
          <div class="custom-title">
            用占位符 <b>$fileName</b> 来表示文件名的位置
          </div>
          <el-input 
            class="align-center"
            v-model="customLink.value"
            :autofocus="true"
          ></el-input>
        </el-form-item>
      </el-form>
      <div>
        如[$fileName]($url)
      </div>
      <span slot="footer">
        <el-button @click="cancelCustomLink" round>取消</el-button>
        <el-button type="primary" @click="confirmCustomLink" round>确定</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="设置代理"
      :visible.sync="proxyVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="right"
        :model="customLink"
        ref="customLink"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item
          label="代理地址"
        >
          <el-input 
            v-model="proxy"
            :autofocus="true"
            placeholder="例如：http://127.0.0.1:1080"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelProxy" round>取消</el-button>
        <el-button type="primary" @click="confirmProxy" round>确定</el-button>
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
        <el-button @click="cancelCheckVersion" round>取消</el-button>
        <el-button type="primary" @click="confirmCheckVersion" round>确定</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="设置日志文件"
      :visible.sync="logFileVisible"
      :modal-append-to-body="false"
    >
      <el-form
        label-position="right"
        label-width="100px"
      >
        <el-form-item
          label="日志文件"
        >
          <el-button type="primary" round size="mini" @click="openFile('picgo.log')">点击打开</el-button>
        </el-form-item>
        <el-form-item
          label="日志记录等级"
        >
          <el-select
            v-model="form.logLevel"
            multiple
            collapse-tags
          >
            <el-option
              v-for="(value, key) of logLevel"
              :key="key"
              :label="value"
              :value="key"
              :disabled="handleLevelDisabled(key)"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="cancelLogLevelSetting" round>取消</el-button>
        <el-button type="primary" @click="confirmLogLevelSetting" round>确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import keyDetect from 'utils/key-binding'
import pkg from 'root/package.json'
import path from 'path'
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
    let logLevel = this.$db.get('settings.logLevel')
    if (!Array.isArray(logLevel)) {
      if (logLevel && logLevel.length > 0) {
        logLevel = [logLevel]
      } else {
        logLevel = ['all']
      }
    }
    return {
      form: {
        updateHelper: this.$db.get('settings.showUpdateTip'),
        showPicBedList: [],
        autoStart: this.$db.get('settings.autoStart') || false,
        rename: this.$db.get('settings.rename') || false,
        autoRename: this.$db.get('settings.autoRename') || false,
        uploadNotification: this.$db.get('settings.uploadNotification') || false,
        miniWindowOntop: this.$db.get('settings.miniWindowOntop') || false,
        logLevel
      },
      picBed: [],
      logFileVisible: false,
      keyBindingVisible: false,
      customLinkVisible: false,
      checkUpdateVisible: false,
      proxyVisible: false,
      customLink: {
        value: this.$db.get('settings.customLink') || '$url'
      },
      shortKey: {
        upload: this.$db.get('settings.shortKey.upload')
      },
      proxy: this.$db.get('picBed.proxy') || undefined,
      rules: {
        value: [
          { validator: customLinkRule, trigger: 'blur' }
        ]
      },
      logLevel: {
        all: '全部-All',
        success: '成功-Success',
        error: '错误-Error',
        info: '普通-Info',
        warn: '提醒-Warn',
        none: '不记录日志-None'
      },
      version: pkg.version,
      latestVersion: '',
      os: ''
    }
  },
  created () {
    this.os = process.platform
    this.$electron.ipcRenderer.send('getPicBeds')
    this.$electron.ipcRenderer.on('getPicBeds', this.getPicBeds)
  },
  methods: {
    getPicBeds (event, picBeds) {
      this.picBed = picBeds
      this.form.showPicBedList = this.picBed.map(item => {
        if (item.visible) {
          return item.name
        }
      })
    },
    openFile (file) {
      const { app, shell } = this.$electron.remote
      const STORE_PATH = app.getPath('userData')
      const FILE = path.join(STORE_PATH, `/${file}`)
      shell.openItem(FILE)
    },
    openLogSetting () {
      this.logFileVisible = true
    },
    keyDetect (type, event) {
      this.shortKey[type] = keyDetect(event).join('+')
    },
    cancelKeyBinding () {
      this.keyBindingVisible = false
      this.shortKey = this.$db.get('settings.shortKey')
    },
    cancelCustomLink () {
      this.customLinkVisible = false
      this.customLink.value = this.$db.get('settings.customLink') || '$url'
    },
    confirmCustomLink () {
      this.$refs.customLink.validate((valid) => {
        if (valid) {
          this.$db.set('settings.customLink', this.customLink.value)
          this.customLinkVisible = false
          this.$electron.ipcRenderer.send('updateCustomLink')
        } else {
          return false
        }
      })
    },
    cancelProxy () {
      this.proxyVisible = false
      this.proxy = this.$db.get('picBed.proxy') || undefined
    },
    confirmProxy () {
      this.proxyVisible = false
      this.$db.set('picBed.proxy', this.proxy)
      const successNotification = new window.Notification('设置代理', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
    },
    updateHelperChange (val) {
      this.$db.set('settings.showUpdateTip', val)
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
      this.$db.set('picBed.list', list)
      this.$electron.ipcRenderer.send('getPicBeds')
    },
    handleAutoStartChange (val) {
      this.$db.set('settings.autoStart', val)
      this.$electron.ipcRenderer.send('autoStart', val)
    },
    handleRename (val) {
      this.$db.set('settings.rename', val)
    },
    handleAutoRename (val) {
      this.$db.set('settings.autoRename', val)
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
    },
    handleUploadNotification (val) {
      this.$db.set('settings.uploadNotification', val)
    },
    handleMiniWindowOntop (val) {
      this.$db.set('settings.miniWindowOntop', val)
      this.$message('需要重启生效')
    },
    confirmLogLevelSetting () {
      if (this.form.logLevel.length === 0) {
        return this.$message.error('请选择日志记录等级')
      }
      this.$db.set('settings.logLevel', this.form.logLevel)
      const successNotification = new window.Notification('设置日志', {
        body: '设置成功'
      })
      successNotification.onclick = () => {
        return true
      }
      this.logFileVisible = false
    },
    cancelLogLevelSetting () {
      this.logFileVisible = false
      let logLevel = this.$db.get('settings.logLevel')
      if (!Array.isArray(logLevel)) {
        if (logLevel && logLevel.length > 0) {
          logLevel = [logLevel]
        } else {
          logLevel = ['all']
        }
      }
      this.form.logLevel = logLevel
    },
    handleLevelDisabled (val) {
      let currentLevel = val
      let flagLevel
      let result = this.form.logLevel.some(item => {
        if (item === 'all' || item === 'none') {
          flagLevel = item
        }
        return (item === 'all' || item === 'none')
      })
      if (result) {
        if (currentLevel !== flagLevel) {
          return true
        }
      } else if (this.form.logLevel.length > 0) {
        if (val === 'all' || val === 'none') {
          return true
        }
      }
      return false
    },
    goConfigPage () {
      this.$electron.remote.shell.openExternal('https://picgo.github.io/PicGo-Doc/zh/guide/config.html#picgo设置')
    },
    goShortCutPage () {
      this.$router.push('shortcut-page')
    }
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeListener('getPicBeds', this.getPicBeds)
  }
}
</script>
<style lang='stylus'>
.el-message
  left 60%
.view-title
  .el-icon-document
    cursor pointer
    transition color .2s ease-in-out
    &:hover
      color #49B1F5
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