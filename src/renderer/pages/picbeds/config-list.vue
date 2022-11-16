<template>
  <div id="config-list-view">
    <el-row :gutter="20" align="middle" class="config-list">
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
          <div class="config-name">{{item.name}}</div>
          <div class="config-update-time">{{item._updatedAt}}</div>
          <div class="operation-container">
            <i class="el-icon-edit"></i>
            <i class="el-icon-delete"></i>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { uuid } from 'uuidv4'

@Component({
  name: 'OssConfigList'
})
export default class extends Vue {
  @Prop() private id!: string;
  curConfigList: IStringKeyMap[] = [];
  defaultConfigId = '';

  async selectItem (id: string) {
    await this.saveConfig(`uploader.${this.id}.defaultId`, id)
    this.defaultConfigId = id
  }

  created () {
    this.getCurrentConfigList()
  }

  async getCurrentConfigList () {
    const curUploaderConfig = await this.getConfig<IStringKeyMap>(`uploader.${this.id}`) ?? {}
    let curConfigList = curUploaderConfig?.configList
    this.defaultConfigId = curUploaderConfig?.defaultId

    if (!curConfigList) {
      curConfigList = await this.fixUploaderConfig()
    }

    this.curConfigList = curConfigList
  }

  async fixUploaderConfig (): Promise<IStringKeyMap[]> {
    const curSelectUploaderConfig = await this.getConfig<IStringKeyMap>(`picBed.${this.id}`) ?? {}

    if (!curSelectUploaderConfig._id) {
      curSelectUploaderConfig._id = uuid()
      curSelectUploaderConfig.name = '默认配置'
      curSelectUploaderConfig._createdAt = Date.now()
      curSelectUploaderConfig._updatedAt = Date.now()
    }

    const curUploaderConfigList = [curSelectUploaderConfig]
    await this.saveConfig(`uploader.${this.id}`, {
      configList: curUploaderConfigList,
      defaultId: curSelectUploaderConfig._id
    })

    return curUploaderConfigList
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
      .operation-container
        position absolute
        right: 5px
        top: 8px
        font-size: 18pxc
        color #eee
        .el-icon-edit
        .el-icon-delete
          cursor pointer
        .el-icon-edit
          margin-right: 10px
    .selected
      border 1px solid #409EFF
</style>
