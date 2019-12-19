<template>
  <div id="config-form">
    <el-form
      label-position="right"
      label-width="120px"
      :model="ruleForm"
      ref="form"
      size="mini"
    >
      <el-form-item
        v-for="(item, index) in configList"
        :label="item.alias || item.name"
        :required="item.required"
        :prop="item.name"
        :key="item.name + index"
      >
        <el-input
          v-if="item.type === 'input' || item.type === 'password'"
          :type="item.type === 'password' ? 'password' : 'input'"
          v-model="ruleForm[item.name]"
          :placeholder="item.message || item.name"
        ></el-input>
        <el-select
          v-else-if="item.type === 'list'"
          v-model="ruleForm[item.name]"
          :placeholder="item.message || item.name"
        >
          <el-option
            v-for="choice in item.choices"
            :label="choice.name || choice.value || choice"
            :key="choice.name || choice.value || choice"
            :value="choice.value || choice"
          ></el-option>
        </el-select>
        <el-select
          v-else-if="item.type === 'checkbox'"
          v-model="ruleForm[item.name]"
          :placeholder="item.message || item.name"
          multiple
          collapse-tags
        >
          <el-option
            v-for="choice in item.choices"
            :label="choice.name || choice.value || choice"
            :key="choice.value || choice"
            :value="choice.value || choice"
          ></el-option>
        </el-select>
        <el-switch
          v-else-if="item.type === 'confirm'"
          v-model="ruleForm[item.name]"
          active-text="yes"
          inactive-text="no"
        >
        </el-switch>
      </el-form-item>
      <slot></slot>
    </el-form>
  </div>
</template>
<script lang="ts">
import {
  Component,
  Vue,
  Prop,
  Watch
} from 'vue-property-decorator'
import { cloneDeep, union } from 'lodash'

@Component({
  name: 'config-form'
})
export default class extends Vue {
  @Prop(Array) readonly config: Array<any> = []
  @Prop(String) readonly type: string = ''
  @Prop(String) readonly id: string = ''
  configList = []
  ruleForm = {}
  @Watch('config', {
    deep: true,
    immediate: true
  })
  handleConfigChange (val: any) {
    this.ruleForm = Object.assign({}, {})
    const config = this.$db.get(`picBed.${this.id}`)
    if (val.length > 0) {
      this.configList = cloneDeep(val).map((item: any) => {
        let defaultValue = item.default !== undefined
          ? item.default : item.type === 'checkbox'
            ? [] : null
        if (item.type === 'checkbox') {
          const defaults = item.choices.filter((i: any) => {
            return i.checked
          }).map((i: any) => i.value)
          defaultValue = union(defaultValue, defaults)
        }
        if (config && config[item.name] !== undefined) {
          defaultValue = config[item.name]
        }
        this.$set(this.ruleForm, item.name, defaultValue)
        return item
      })
    }
  }
  async validate () {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.$refs.form.validate((valid: boolean) => {
        if (valid) {
          resolve(this.ruleForm)
        } else {
          resolve(false)
          return false
        }
      })
    })
  }
}
</script>
<style lang='stylus'>
#config-form
  .el-form
    label
      line-height 22px
      padding-bottom 0
    .el-button-group
      width 100%
      .el-button
        width 50%
    .el-input__inner
      border-radius 19px
    .el-radio-group
      margin-left 25px
    .el-switch__label
      &.is-active
        color #409EFF
</style>
