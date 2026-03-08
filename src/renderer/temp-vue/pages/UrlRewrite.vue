<template>
  <div id="url-rewrite-page">
    <div class="view-title">
      {{ $T('SETTINGS_URL_REWRITE') }}
    </div>
    <el-row
      class="url-rewrite-list"
      justify="center"
    >
      <el-col
        :span="20"
        :offset="2"
      >
        <div class="flex mb-[12px] justify-between align-middle">
          <div class="text-[12px] text-[#bbb] leading-[18px]">
            {{ $T('URL_REWRITE_HELP') }}
          </div>
          <el-button
            type="primary"
            size="small"
            @click="openAddDialog"
          >
            <el-icon class="mr-[4px]">
              <Plus />
            </el-icon>
            {{ $T('URL_REWRITE_ADD_RULE') }}
          </el-button>
        </div>

        <el-table
          class="url-rewrite-table-border"
          :data="rules"
          size="small"
          header-cell-class-name="url-rewrite-table-border"
          cell-class-name="url-rewrite-table-border"
          :empty-text="$T('URL_REWRITE_EMPTY')"
        >
          <el-table-column
            width="50px"
            :label="$T('URL_REWRITE_ORDER')"
          >
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>

          <el-table-column
            min-width="300px"
            :label="$T('URL_REWRITE_MATCH')"
          >
            <template #default="scope">
              <span class="font-mono text-[12px] break-all">
                {{ scope.row.match }}
              </span>
            </template>
          </el-table-column>

          <el-table-column
            width="80px"
            :label="$T('URL_REWRITE_FLAGS')"
          >
            <template #default="scope">
              <el-tag
                v-if="scope.row.global"
                size="small"
              >
                G
              </el-tag>
              <el-tag
                v-if="scope.row.ignoreCase"
                size="small"
                class="ml-[4px]"
              >
                I
              </el-tag>
              <span v-if="!scope.row.global && !scope.row.ignoreCase">-</span>
            </template>
          </el-table-column>

          <el-table-column
            width="70px"
            :label="$T('URL_REWRITE_ENABLED')"
          >
            <template #default="scope">
              <el-switch
                v-model="scope.row.enable"
                @change="handleToggleEnable(scope.$index, $event as boolean)"
              />
            </template>
          </el-table-column>

          <el-table-column
            width="220px"
            :label="$T('URL_REWRITE_ACTIONS')"
          >
            <template #default="scope">
              <el-row class="mb-[2px]">
                <el-button
                  size="small"
                  type="text"
                  :disabled="scope.$index === 0"
                  @click="moveRule(scope.$index, scope.$index - 1)"
                >
                  <el-icon class="mr-[2px]">
                    <ArrowUp />
                  </el-icon>
                  {{ $T('URL_REWRITE_MOVE_UP') }}
                </el-button>
                <el-button
                  size="small"
                  type="text"
                  :disabled="scope.$index === rules.length - 1"
                  @click="moveRule(scope.$index, scope.$index + 1)"
                >
                  <el-icon class="mr-[2px]">
                    <ArrowDown />
                  </el-icon>
                  {{ $T('URL_REWRITE_MOVE_DOWN') }}
                </el-button>
              </el-row>
              <el-row>
                <el-button
                  size="small"
                  type="text"
                  @click="openEditDialog(scope.row, scope.$index)"
                >
                  <el-icon class="mr-[2px]">
                    <Edit />
                  </el-icon>
                  {{ $T('URL_REWRITE_EDIT') }}
                </el-button>
                <el-button
                  class="danger"
                  size="small"
                  type="text"
                  @click="confirmDelete(scope.$index)"
                >
                  <el-icon class="mr-[2px]">
                    <Delete />
                  </el-icon>
                  {{ $T('URL_REWRITE_DELETE') }}
                </el-button>
              </el-row>
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-[16px] rounded-[8px] url-rewrite-panel p-[12px]">
          <div class="text-[14px] mb-[8px] text-[#bbb] font-bold">
            {{ $T('URL_REWRITE_PREVIEW_TITLE') }}
          </div>
          <div class="text-[12px] text-[#bbb] leading-[18px] mb-[10px]">
            {{ $T('URL_REWRITE_PREVIEW_TIPS') }}
          </div>

          <el-row
            class="mb-[10px]"
            :gutter="10"
          >
            <el-col :span="18">
              <el-input
                v-model="previewInputUrl"
                :placeholder="$T('URL_REWRITE_PREVIEW_PLACEHOLDER')"
                size="small"
              />
            </el-col>
            <el-col :span="6">
              <el-button
                type="primary"
                size="small"
                class="w-full"
                @click="runPreview"
              >
                {{ $T('URL_REWRITE_PREVIEW_RUN') }}
              </el-button>
            </el-col>
          </el-row>

          <el-alert
            v-if="previewStatus === 'error'"
            :title="previewMessage"
            type="error"
            show-icon
            :closable="false"
          />
          <el-alert
            v-else-if="previewStatus === 'matched'"
            :title="previewMessage"
            type="success"
            show-icon
            :closable="false"
          />
          <el-alert
            v-else-if="previewStatus === 'noMatch'"
            :title="previewMessage"
            type="info"
            show-icon
            :closable="false"
          />

          <div
            v-if="previewStatus !== 'idle'"
            class="mt-[10px]"
          >
            <div class="text-[12px] text-[#bbb] mb-[6px]">
              {{ $T('URL_REWRITE_PREVIEW_OUTPUT') }}
            </div>
            <div class="rounded-[6px] url-rewrite-mono-box p-[10px] font-mono text-[12px] break-all text-[#bbb]">
              {{ previewOutputUrl }}
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="editDialogVisible"
      :title="editDialogTitle"
      width="500px"
      :append-to-body="true"
    >
      <el-form
        label-position="top"
        label-width="80px"
        size="small"
      >
        <el-form-item
          :label="$T('URL_REWRITE_MATCH')"
        >
          <div class="flex flex-col gap-[6px] w-full">
            <div class="text-[12px] text-[#bbb] leading-[18px]">
              {{ $T('URL_REWRITE_MATCH_TIPS') }}
            </div>
            <el-input
              v-model="ruleForm.match"
              class="align-center"
              :autofocus="true"
              :placeholder="$T('URL_REWRITE_MATCH_PLACEHOLDER')"
            />
          </div>
        </el-form-item>

        <el-form-item
          :label="$T('URL_REWRITE_REPLACE')"
        >
          <div class="flex flex-col gap-[6px] w-full">
            <div class="text-[12px] text-[#bbb] leading-[18px]">
              {{ $T('URL_REWRITE_REPLACE_TIPS') }}
            </div>
            <el-input
              v-model="ruleForm.replace"
              class="align-center"
              :placeholder="$T('URL_REWRITE_REPLACE_PLACEHOLDER')"
            />
          </div>
        </el-form-item>

        <el-form-item
          :label="$T('URL_REWRITE_OPTIONS')"
        >
          <div class="flex flex-col gap-[10px] w-full">
            <el-row
              justify="space-between"
              align="middle"
            >
              <div class="text-[13px]">
                {{ $T('URL_REWRITE_RULE_ENABLED') }}
              </div>
              <el-switch v-model="ruleForm.enable" />
            </el-row>

            <div class="grid grid-cols-2 gap-[12px]">
              <div class="rounded-[6px] url-rewrite-option-card p-[10px]">
                <el-checkbox
                  v-model="ruleForm.global"
                >
                  {{ $T('URL_REWRITE_FLAG_GLOBAL_LABEL') }}
                </el-checkbox>
                <div class="text-[12px] text-[#bbb] leading-[18px] mt-[6px]">
                  {{ $T('URL_REWRITE_FLAG_GLOBAL_DESC') }}
                </div>
              </div>
              <div class="rounded-[6px] url-rewrite-option-card p-[10px]">
                <el-checkbox
                  v-model="ruleForm.ignoreCase"
                >
                  {{ $T('URL_REWRITE_FLAG_IGNORE_CASE_LABEL') }}
                </el-checkbox>
                <div class="text-[12px] text-[#bbb] leading-[18px] mt-[6px]">
                  {{ $T('URL_REWRITE_FLAG_IGNORE_CASE_DESC') }}
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button
          round
          @click="cancelEditDialog"
        >
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          round
          @click="confirmEditDialog"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown, ArrowUp, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage as $message, ElMessageBox } from 'element-plus'
import { computed, onBeforeMount, reactive, ref } from 'vue'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { T as $T } from '@/i18n'

interface IUrlRewriteRule {
  match: string
  replace: string
  enable: boolean
  global: boolean
  ignoreCase: boolean
}

const $confirm = ElMessageBox.confirm

const rules = ref<IUrlRewriteRule[]>([])

const editDialogVisible = ref(false)
const editDialogMode = ref<'add' | 'edit'>('add')
const editRuleIndex = ref(-1)

const previewInputUrl = ref('')
const previewOutputUrl = ref('')
const previewStatus = ref<'idle' | 'matched' | 'noMatch' | 'error'>('idle')
const previewMessage = ref('')

const ruleForm = reactive<IUrlRewriteRule>({
  match: '',
  replace: '',
  enable: true,
  global: false,
  ignoreCase: false
})

const editDialogTitle = computed(() => {
  return editDialogMode.value === 'add' ? $T('URL_REWRITE_ADD_RULE') : $T('URL_REWRITE_EDIT_RULE')
})

onBeforeMount(async () => {
  await initRules()
})

async function initRules () {
  const configRules = await getConfig<unknown>('settings.urlRewrite.rules')
  rules.value = normalizeRules(configRules)
}

function normalizeRules (value: unknown): IUrlRewriteRule[] {
  if (!Array.isArray(value)) return []
  return value.map(item => {
    const raw = (item ?? {}) as Partial<Record<keyof IUrlRewriteRule, unknown>>
    return {
      match: String(raw.match ?? ''),
      replace: String(raw.replace ?? ''),
      enable: raw.enable === false ? false : true,
      global: raw.global === true,
      ignoreCase: raw.ignoreCase === true
    }
  })
}

async function persistRules () {
  try {
    await saveConfig('settings.urlRewrite.rules', rules.value)
  } catch (e) {
    $message.error($T('OPERATION_FAILED'))
    throw e
  }
}

async function handleToggleEnable (index: number, value: boolean) {
  if (!rules.value[index]) return
  rules.value[index].enable = value
  await persistRules()
}

async function moveRule (fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  if (toIndex < 0 || toIndex >= rules.value.length) return
  const next = [...rules.value]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  rules.value = next
  await persistRules()
}

async function confirmDelete (index: number) {
  if (!rules.value[index]) return
  try {
    await $confirm($T('URL_REWRITE_DELETE_CONFIRM'), $T('TIPS_WARNING'), {
      type: 'warning',
      confirmButtonText: $T('CONFIRM'),
      cancelButtonText: $T('CANCEL')
    })
  } catch {
    return
  }
  rules.value.splice(index, 1)
  await persistRules()
}

function openAddDialog () {
  editDialogMode.value = 'add'
  editRuleIndex.value = -1
  ruleForm.match = ''
  ruleForm.replace = ''
  ruleForm.enable = true
  ruleForm.global = false
  ruleForm.ignoreCase = false
  editDialogVisible.value = true
}

function openEditDialog (rule: IUrlRewriteRule, index: number) {
  editDialogMode.value = 'edit'
  editRuleIndex.value = index
  ruleForm.match = rule.match
  ruleForm.replace = rule.replace
  ruleForm.enable = rule.enable
  ruleForm.global = rule.global
  ruleForm.ignoreCase = rule.ignoreCase
  editDialogVisible.value = true
}

function cancelEditDialog () {
  editDialogVisible.value = false
}

function buildRuleFlags (rule: Pick<IUrlRewriteRule, 'global' | 'ignoreCase'>) {
  return `${rule.global ? 'g' : ''}${rule.ignoreCase ? 'i' : ''}`
}

function validateRuleOrThrow (rule: IUrlRewriteRule) {
  if (!rule.match.trim()) {
    throw new Error($T('URL_REWRITE_MATCH_REQUIRED'))
  }
  if (!rule.replace.trim()) {
    throw new Error($T('URL_REWRITE_REPLACE_REQUIRED'))
  }
  new RegExp(rule.match, buildRuleFlags(rule))
}

function runPreview () {
  previewStatus.value = 'idle'
  previewMessage.value = ''
  previewOutputUrl.value = previewInputUrl.value

  const url = previewInputUrl.value
  if (!url) {
    previewStatus.value = 'error'
    previewMessage.value = $T('URL_REWRITE_PREVIEW_INPUT_REQUIRED')
    return
  }

  for (const [index, rule] of rules.value.entries()) {
    if (rule.enable === false) continue
    let regexp: RegExp
    try {
      regexp = new RegExp(rule.match, buildRuleFlags(rule))
    } catch (e) {
      previewStatus.value = 'error'
      previewMessage.value = `${$T('URL_REWRITE_PREVIEW_RULE_INVALID')} #${index + 1}: ${(e as Error).message}`
      return
    }

    const matched = regexp.test(url)
    regexp.lastIndex = 0
    if (!matched) continue

    const output = url.replace(regexp, rule.replace)
    previewOutputUrl.value = output
    previewStatus.value = 'matched'
    previewMessage.value = `${$T('URL_REWRITE_PREVIEW_MATCHED_RULE')} #${index + 1}`
    return
  }

  previewStatus.value = 'noMatch'
  previewMessage.value = $T('URL_REWRITE_PREVIEW_NO_MATCH')
}

async function confirmEditDialog () {
  const nextRule: IUrlRewriteRule = {
    match: ruleForm.match,
    replace: ruleForm.replace,
    enable: ruleForm.enable,
    global: ruleForm.global,
    ignoreCase: ruleForm.ignoreCase
  }

  try {
    validateRuleOrThrow(nextRule)
  } catch (e) {
    $message.error((e as Error).message || $T('URL_REWRITE_INVALID_REGEX'))
    return
  }

  if (editDialogMode.value === 'add') {
    rules.value.push(nextRule)
  } else if (editRuleIndex.value >= 0 && rules.value[editRuleIndex.value]) {
    rules.value.splice(editRuleIndex.value, 1, nextRule)
  }

  await persistRules()
  editDialogVisible.value = false
  $message.success($T('TIPS_SET_SUCCEED'))
}

</script>

<script lang="ts">
export default {
  name: 'UrlRewritePage'
}
</script>

<style lang='stylus'>
#url-rewrite-page
  .url-rewrite-list
    height 360px
    box-sizing border-box
    overflow-y auto
    overflow-x hidden
    width 100%
  .url-rewrite-panel
    background rgba(130, 130, 130, .12)
    border 1px solid darken(#eee, 50%)
  .url-rewrite-option-card
    background rgba(130, 130, 130, .12)
    border 1px solid rgba(255, 255, 255, .06)
  .url-rewrite-mono-box
    background rgba(130, 130, 130, .12)
    border 1px solid rgba(255, 255, 255, .06)
  .url-rewrite-table-border
    border-color darken(#eee, 50%)
  .el-checkbox__label
    color #aaa
  .el-table
    background-color: transparent
    color #ddd
    &::before
      background-color darken(#eee, 50%)
    thead
      color #bbb
    th,tr
      background-color: transparent
    &__body
      tr.el-table__row--striped
        td
          background transparent
    &--enable-row-hover
      .el-table__body
        tr:hover
          &>td
            background #333
  .el-button+.el-button
    margin-left 4px
  .el-button
    &.danger
      color: #F56C6C
</style>
