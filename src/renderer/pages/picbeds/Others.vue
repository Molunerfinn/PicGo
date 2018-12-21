<template>
  <div id="others-view">
    <el-row :gutter="16">
      <el-col :span="16" :offset="4">
        <div class="view-title">
          Imgur图床设置
        </div>
        <el-form 
          ref="imgur"
          label-position="right"
          label-width="120px"
          :model="form"
          size="mini">
          <el-form-item
            label="设定ClientId"
            prop="clientId"
            :rules="{
              required: true, message: 'ClientId不能为空', trigger: 'blur'
            }">
            <el-input v-model="form.clientId" placeholder="ClientId" @keyup.native.enter="confirm"></el-input>
          </el-form-item>
          <el-form-item
            label="设定代理"
            prop="proxy"
            >
            <el-input v-model="form.proxy" placeholder="例如：http://127.0.0.1:1080" @keyup.native.enter="confirm"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button-group>
              <el-button type="primary" @click="confirm" round>确定</el-button>
              <el-button type="success" @click="setDefaultPicBed(type)" round :disabled="defaultPicBed === type">设为默认图床</el-button>
            </el-button-group>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import mixin from '@/utils/ConfirmButtonMixin'
export default {
  name: 'OtherPicBed',
  mixins: [mixin],
  data () {
    return {
      type: ''
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      console.log(vm)
    })
  }
}
</script>
<style lang='stylus'>
</style>