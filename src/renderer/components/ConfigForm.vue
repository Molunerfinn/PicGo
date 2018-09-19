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
        :key="index"
        :label="item.name"
        :required="item.required"
        :prop="item.name"
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
            v-for="(choice, idx) in item.choices"
            :label="choice.name || choice"
            :key="choice"
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
    </el-form>
  </div>
</template>
<script>
export default {
  name: 'config-form',
  props: {
    config: Array,
    type: String,
    name: String
  },
  data () {
    return {
      configList: [],
      ruleForm: {}
    }
  },
  created () {
    this.configList = JSON.parse(JSON.stringify(this.config)).map(item => {
      const defaultValue = item.default !== undefined ? item.default : null
      this.$set(this.ruleForm, item.name, defaultValue)
      return item
    })
  },
  mounted () {
    console.log(this.$refs.form)
  },
  methods: {
    validate () {
      this.$refs.form.validate(valid => {
        if (valid) {
          console.log(this.ruleForm)
        } else {
          return false
        }
      })
    }
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