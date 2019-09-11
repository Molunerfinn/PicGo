<template>
  <el-dialog
    title="设置快捷键"
    :visible.sync="visible"
    :modal-append-to-body="false"
  >

  </el-dialog>
</template>
<script>
// import keyDetect from 'utils/key-binding'
export default {
  name: '',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  created () {
    this.$db.get('settings.shortKey')
  },
  data () {
    return {
      list: []
    }
  }
}
</script>
<style lang='stylus'>
</style>
