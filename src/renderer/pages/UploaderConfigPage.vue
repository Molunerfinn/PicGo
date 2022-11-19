<template>
  <div id="config-list-view">
    <el-row :gutter="20" align="middle" class="config-list">
      <div class="view-title">
        {{ $T('SETTINGS') }}
      </div>
      <el-col
        class="config-item-col"
        v-for="item in curConfigList"
        :key="item._id"
        :span="10"
        :offset="1"
      >
        <div
          :class="`config-item ${defaultConfigId === item._id ? 'selected' : ''}`"
          @click="() => selectItem(item._id)"
        >
          <div class="config-name">{{item._configName}}</div>
          <div class="config-update-time">{{formatTime(item._updatedAt)}}</div>
          <div v-if="defaultConfigId === item._id" class="default-text">{{$T('SELECTED_SETTING_HINT')}}</div>
          <div class="operation-container">
            <i class="el-icon-edit" @click="openEditPage(item._id)"></i>
            <i :class="`el-icon-delete ${curConfigList.length <= 1 ? 'disabled' : ''}`" @click="() => deleteConfig(item._id)"></i>
          </div>
        </div>
      </el-col>
      <el-col
        class="config-item-col"
        :span="11"
        :offset="1"
      >
        <div
          class="config-item config-item-add"
          @click="addNewConfig"
        >
          <i class="el-icon-plus"></i>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import dayjs from 'dayjs'
import { completeUploaderMetaConfig } from '../utils/uploader'

@Component({
  name: 'OssConfigList'
})
export default class extends Vue {
  type!: string;
  curConfigList: IStringKeyMap[] = [];
  defaultConfigId = '';

  async selectItem (id: string) {
    await this.saveConfig(`uploader.${this.type}.defaultId`, id)
    const activeConfig = this.curConfigList.find(i => i._id === id)
    await this.saveConfig(`picBed.${this.type}`, activeConfig)
    this.defaultConfigId = id
  }

  created () {
    this.type = this.$route.params.type
    this.getCurrentConfigList()
  }

  async getCurrentConfigList () {
    const curUploaderConfig = await this.getConfig<IStringKeyMap>(`uploader.${this.type}`) ?? {}
    let curConfigList = curUploaderConfig?.configList
    this.defaultConfigId = curUploaderConfig?.defaultId

    if (!curConfigList) {
      curConfigList = await this.fixUploaderConfig()
    }

    this.curConfigList = curConfigList
  }

  async fixUploaderConfig (): Promise<IStringKeyMap[]> {
    const curUploaderConfig = await this.getConfig<IStringKeyMap>(`picBed.${this.type}`) ?? {}

    if (!curUploaderConfig._id) {
      Object.assign(
        curUploaderConfig,
        completeUploaderMetaConfig(curUploaderConfig)
      )
    }

    const curUploaderConfigList = [curUploaderConfig]
    await this.saveConfig(`uploader.${this.type}`, {
      configList: curUploaderConfigList,
      defaultId: curUploaderConfig._id
    })

    // fix exist config
    await this.saveConfig(`picBed.${this.type}`, curUploaderConfig)

    this.defaultConfigId = curUploaderConfig._id

    return curUploaderConfigList
  }

  openEditPage (configId: string) {
    this.$router.push({
      name: 'picbeds',
      params: {
        type: this.type,
        configId
      }
    })
  }

  formatTime (time: number):string {
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  }

  async deleteConfig (id: string) {
    if (this.curConfigList.length <= 1) return
    const updatedConfigList = this.curConfigList.filter(i => i._id === id)

    if (id === this.defaultConfigId) {
      this.defaultConfigId = updatedConfigList[0]._id
    }

    await this.saveConfig(`uploader.${this.type}.configList`, updatedConfigList)
    this.curConfigList = updatedConfigList
  }

  addNewConfig () {
    this.$router.push({
      name: 'picbeds',
      params: {
        type: this.type,
        configId: ''
      }
    })
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
      .default-text
        color: #67C23A
        font-size: 12px
        margin-top: 5px
      .operation-container
        position absolute
        right: 5px
        top: 8px
        font-size: 18pxc
        display: flex
        align-items: center
        color #eee
        .el-icon-edit
        .el-icon-delete
          cursor pointer
        .el-icon-edit
          margin-right: 10px
        .disabled
          cursor: not-allowed
          color: #aaa
    .config-item-add
      width: 80px
      display: flex
      justify-content: center
      align-items: center
      color: #eee
      font-size: 28px
    .selected
      border 1px solid #409EFF
</style>
