<template>
  <div
    id="base-config-form"
    :class="theme ?? 'dark'"
  >
    <el-form
      ref="$form"
      label-position="left"
      label-width="50%"
      :model="form"
      size="small"
    >
      <slot name="extra-form" />
      <!-- dynamic config -->
      <el-form-item
        v-for="(item, index) in config"
        :key="item.name + index"
        :required="item.required"
        :prop="item.name"
        :class="index !== config.length - 1 ? 'has-border' : ''"
      >
        <template #label>
          <el-row align="middle">
            {{ item.alias || item.name }}
            <template v-if="item.tips">
              <el-tooltip
                class="item"
                effect="dark"
                placement="right"
              >
                <template #content>
                  <span
                    class="config-form-common-tips"
                    v-html="transformMarkdownToHTML(item.tips)"
                  />
                </template>
                <el-icon class="ml-[4px] cursor-pointer hover:text-blue">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </template>
          </el-row>
        </template>
        <el-input
          v-if="item.type === 'input' || item.type === 'password'"
          v-model="form[item.name]"
          :type="item.type === 'password' ? 'password' : 'input'"
          :placeholder="item.message || item.name"
        />
        <el-select
          v-else-if="item.type === 'list' && item.choices"
          v-model="form[item.name]"
          :placeholder="item.message || item.name"
        >
          <el-option
            v-for="choice in item.choices"
            :key="choice.name || choice.value || choice"
            :label="choice.name || choice.value || choice"
            :value="choice.value || choice"
          />
        </el-select>
        <el-select
          v-else-if="item.type === 'checkbox' && item.choices"
          v-model="form[item.name]"
          :placeholder="item.message || item.name"
          multiple
          collapse-tags
        >
          <el-option
            v-for="choice in item.choices"
            :key="choice.value || choice"
            :label="choice.name || choice.value || choice"
            :value="choice.value || choice"
          />
        </el-select>
        <el-switch
          v-else-if="item.type === 'confirm'"
          v-model="form[item.name]"
          :active-text="item.confirmText || 'yes'"
          :inactive-text="item.cancelText || 'no'"
        />
      </el-form-item>
      <slot />
    </el-form>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { marked } from 'marked'
import type { FormInstance } from 'element-plus'
import { useVModel } from '@/hooks/useVModel'

const $form = ref<FormInstance>()

interface IProps {
  config: IPicGoPluginConfig[]
  formModel: IStringKeyMap
  theme?: 'light' | 'dark'
}

const props = defineProps<IProps>()

const form = useVModel(props, 'formModel')

function transformMarkdownToHTML (markdown: string) {
  try {
    return marked.parse(markdown)
  } catch (e) {
    return markdown
  }
}

async function validate (): Promise<IStringKeyMap | false> {
  return new Promise((resolve) => {
    $form.value?.validate((valid: boolean) => {
      if (valid) {
        resolve(form.value)
      } else {
        resolve(false)
        return false
      }
    })
  })
}

defineExpose({
  validate
})

</script>
<script lang="ts">
export default {
  name: 'BaseConfigForm'
}
</script>
<style lang='stylus'>
#base-config-form
  .el-form
    label
      line-height 22px
      padding-bottom 0
    &-item
      display: flex
      justify-content space-between
      border-bottom 1px solid darken(#eee, 50%)
      padding-bottom 16px
      &:last-child
        border-bottom none
      &__content
        justify-content flex-end
    .el-button-group
      width 100%
      .el-button
        width 50%
    .el-radio-group
      margin-left 25px
    .el-switch__label
      &.is-active
        color #409EFF
  &.light
    .el-form-item.has-border
      border-bottom 1px solid #ddd
</style>
