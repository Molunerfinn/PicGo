<template>
  <div id="config-list-view">
    <div class="view-title">
      {{ $T('SETTINGS') }}
    </div>
    <el-row :gutter="15" justify="space-between" align="center" type="flex" class="config-list">
      <el-col
        class="config-item-col"
        v-for="item in curConfigList"
        :key="item._id"
        :span="11"
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
            <i :class="`el-icon-delete ${curConfigList.length <= 1 ? 'disabled' : ''}`" @click.stop="() => deleteConfig(item._id)"></i>
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
    <el-row type="flex" justify="center" :span="24" class="set-default-container">
      <el-button class="set-default-btn" type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type">{{ $T('SETTINGS_SET_DEFAULT_PICBED') }}</el-button>
    </el-row>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import dayjs from 'dayjs'
import mixin from '@/utils/ConfirmButtonMixin'
import { IRPCActionType } from '~/universal/types/enum'

@Component({
  name: 'UploaderConfigPage',
  mixins: [mixin]
})
export default class extends Vue {
  type!: string;
  curConfigList: IStringKeyMap[] = [];
  defaultConfigId = '';

  async selectItem (id: string) {
    await this.triggerRPC<void>(IRPCActionType.SELECT_UPLOADER, this.type, id)
    this.defaultConfigId = id
  }

  created () {
    this.type = this.$route.params.type
    this.getCurrentConfigList()
  }

  async getCurrentConfigList () {
    const configList = await this.triggerRPC<IUploaderConfigItem>(IRPCActionType.GET_PICBED_CONFIG_LIST, this.type)
    this.curConfigList = configList?.configList ?? []
    this.defaultConfigId = configList?.defaultId ?? ''
  }

  openEditPage (configId: string) {
    this.$router.push({
      name: 'picbeds',
      params: {
        type: this.type,
        configId
      },
      query: {
        defaultConfigId: this.defaultConfigId
      }
    })
  }

  formatTime (time: number):string {
    return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  }

  async deleteConfig (id: string) {
    const res = await this.triggerRPC<IUploaderConfigItem | undefined>(IRPCActionType.DELETE_PICBED_CONFIG, this.type, id)
    if (!res) return
    this.curConfigList = res.configList
    this.defaultConfigId = res.defaultId
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

  setDefaultPicBed (type: string) {
    this.saveConfig({
      'picBed.current': type,
      'picBed.uploader': type
    })
    // @ts-ignore 来自mixin的数据
    this.defaultPicBed = type
    const successNotification = new Notification(this.$T('SETTINGS_DEFAULT_PICBED'), {
      body: this.$T('TIPS_SET_SUCCEED')
    })
    successNotification.onclick = () => {
      return true
    }
  }
}
</script>
<style lang='stylus'>
#config-list-view
  position relative
  min-height 100%
  overflow-x hidden
  overflow-y auto
  padding-bottom 50px
  box-sizing border-box
  .config-list
    flex-wrap wrap
    width: 98%
    .config-item
      height 85px
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
        color #67C23A
        font-size 12px
        margin-top 5px
      .operation-container
        position absolute
        right 5px
        top 8px
        font-size 18pxc
        display flex
        align-items center
        color #eee
        .el-icon-edit
        .el-icon-delete
          cursor pointer
        .el-icon-edit
          margin-right 10px
        .disabled
          cursor not-allowed
          color #aaa
    .config-item-add
      display: flex
      justify-content: center
      align-items: center
      color: #eee
      font-size: 28px
    .selected
      border 1px solid #409EFF
  .set-default-container
    position absolute
    bottom 10px
    width 100%
    .set-default-btn
      width 250px
</style>
