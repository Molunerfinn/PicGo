<template>
  <div id="choose-pic-bed">
    <span>选择 {{ label }} 作为你默认图床：</span>
    <el-switch
      v-model="value"
      @change="choosePicBed"
    >
    </el-switch>
  </div>
</template>
<script>
export default {
  name: 'choose-pic-bed',
  props: {
    type: String,
    label: String
  },
  data () {
    return {
      value: false
    }
  },
  created () {
    if (this.type === this.$db.get('picBed.current')) {
      this.value = true
    }
  },
  methods: {
    choosePicBed (val) {
      this.$db.set('picBed.current', this.type)
      this.$emit('update:choosed', this.type)
    }
  }
}
</script>
<style lang='stylus'>
</style>