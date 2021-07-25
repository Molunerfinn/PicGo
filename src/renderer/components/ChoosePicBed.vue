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
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
@Component({
  name: 'choose-pic-bed'
})
export default class extends Vue {
  value = false
  @Prop() type!: string
  @Prop() label!: string
  async created () {
    const current = await this.getConfig<string>('picBed.current')
    if (this.type === current) {
      this.value = true
    }
  }
  choosePicBed (val: string) {
    this.saveConfig({
      'picBed.current': this.type,
      'picBed.uploader': this.type
    })
    this.$emit('update:choosed', this.type)
  }
}
</script>
<style lang='stylus'>
</style>
