<template>
  <div id="gallery-view">
    <div class="view-title">
      {{ $T('GALLERY') }} - {{ filterList.length }}
      <el-icon
        style="margin-left: 4px"
        class="cursor-pointer"
        @click="toggleHandleBar"
      >
        <CaretBottom v-show="!handleBarActive" />
        <CaretTop v-show="handleBarActive" />
      </el-icon>
    </div>
    <transition name="el-zoom-in-top">
      <el-row v-show="handleBarActive">
        <el-col
          :span="20"
          :offset="2"
        >
          <el-row
            class="handle-bar"
            :gutter="16"
          >
            <el-col :span="12">
              <el-select
                v-model="selectedPicBed"
                multiple
                collapse-tags
                size="small"
                style="width: 100%"
                :placeholder="$T('CHOOSE_SHOWED_PICBED')"
              >
                <el-option
                  v-for="item in picBed"
                  :key="item.type"
                  :label="item.name"
                  :value="item.type"
                />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select
                v-model="pasteStyle"
                size="small"
                style="width: 100%"
                :placeholder="$T('CHOOSE_PASTE_FORMAT')"
                @change="handlePasteStyleChange"
              >
                <el-option
                  v-for="(value, key) in pasteStyleMap"
                  :key="key"
                  :label="key"
                  :value="value"
                />
              </el-select>
            </el-col>
          </el-row>
          <el-row
            class="handle-bar"
            :gutter="16"
          >
            <el-col :span="12">
              <el-input
                v-model="searchText"
                :placeholder="$T('SEARCH')"
                size="small"
              >
                <template #suffix>
                  <el-icon
                    class="el-input__icon"
                    style="cursor: pointer;"
                    @click="cleanSearch"
                  >
                    <close />
                  </el-icon>
                </template>
              </el-input>
            </el-col>
            <GalleryToolbar
              :selected-list="selectedList"
              :filter-list="filterList"
              :is-all-selected="isAllSelected"
              @multi-copy="multiCopy"
              @multi-remove="multiRemove"
              @toggle-select-all="toggleSelectAll"
              @select-more="selectMore"
            />
          </el-row>
        </el-col>
      </el-row>
    </transition>
    <el-row
      class="gallery-list"
      :class="{ small: handleBarActive }"
    >
      <el-col
        :span="20"
        :offset="2"
      >
        <el-row :gutter="16">
          <photo-slider
            :items="filterList"
            :visible="gallerySliderControl.visible"
            :index="gallerySliderControl.index"
            :should-transition="true"
            @change-index="zoomImage"
            @click-mask="handleClose"
            @close-modal="handleClose"
          />
          <el-col
            v-for="(item, index) in filterList"
            :key="item.id"
            :span="6"
            class="gallery-list__img"
          >
            <div
              class="gallery-list__item"
              @click="zoomImage(index)"
            >
              <img
                v-lazy="item.imgUrl"
                class="gallery-list__item-img"
              >
            </div>
            <div
              class="gallery-list__file-name"
              :title="item.fileName"
            >
              {{ item.fileName }}
            </div>
            <el-row
              class="gallery-list__tool-panel"
              justify="space-between"
              align="middle"
            >
              <el-row>
                <el-icon
                  class="cursor-pointer document"
                  @click="copy(item)"
                >
                  <Document />
                </el-icon>
                <el-icon
                  class="cursor-pointer edit"
                  @click="openDialog(item)"
                >
                  <Edit />
                </el-icon>
                <el-icon
                  class="cursor-pointer delete"
                  @click="remove(item.id)"
                >
                  <Delete />
                </el-icon>
              </el-row>
              <el-checkbox
                v-model="selectedList[item.id ? item.id : '']"
                @change="(val) => handleChooseImage(val, index)"
              />
            </el-row>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-dialog
      v-model="dialogVisible"
      :title="$T('CHANGE_IMAGE_URL')"
      width="500px"
      :modal-append-to-body="false"
    >
      <el-input v-model="imgInfo.imgUrl" />
      <template
        #footer
      >
        <el-button @click="dialogVisible = false">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button
          type="primary"
          @click="confirmModify"
        >
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import type { IResult } from '@picgo/store/dist/types'
import { PASTE_TEXT, GET_PICBEDS } from '#/events/constants'
import { CheckboxValueType, ElMessageBox } from 'element-plus'
import { Close, CaretBottom, Document, Edit, Delete, CaretTop } from '@element-plus/icons-vue'
import {
  ipcRenderer,
  clipboard,
  IpcRendererEvent
} from 'electron'
import { computed, nextTick, onActivated, onBeforeUnmount, onBeforeMount, reactive, ref, watch } from 'vue'
import { getConfig, saveConfig, sendRPC, sendToMain } from '@/utils/dataSender'
import { onBeforeRouteUpdate } from 'vue-router'
import { T as $T } from '@/i18n/index'
import $$db from '@/utils/db'
import GalleryToolbar from './components/gallery/GalleryToolbar.vue'
import { IRPCActionType } from '~/universal/types/enum'
import { getRawData } from '@/utils/common'
const images = ref<ImgInfo[]>([])
const dialogVisible = ref(false)
const imgInfo = reactive({
  id: '',
  imgUrl: ''
})
const $confirm = ElMessageBox.confirm
const selectedList: IObjT<boolean> = reactive({})
const gallerySliderControl = reactive({
  visible: false,
  index: 0
})
const selectedPicBed = ref<string[]>([])
const lastSelected = ref<number>(-1)
const isShiftKeyPress = ref<boolean>(false)
const searchText = ref<string>('')
const handleBarActive = ref<boolean>(false)
const pasteStyle = ref<string>('')
const pasteStyleMap = {
  Markdown: 'markdown',
  HTML: 'HTML',
  URL: 'URL',
  UBB: 'UBB',
  Custom: 'Custom'
}
const picBed = ref<IPicBedType[]>([])
onBeforeRouteUpdate((to, from) => {
  if (from.name === 'gallery') {
    clearSelectedList()
  }
  if (to.name === 'gallery') {
    updateGallery()
  }
})

onBeforeMount(async () => {
  ipcRenderer.on(IRPCActionType.UPDATE_GALLERY, () => {
    nextTick(async () => {
      updateGallery()
    })
  })
  sendToMain(GET_PICBEDS)
  ipcRenderer.on(GET_PICBEDS, getPicBeds)
  updateGallery()

  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
})

function handleDetectShiftKey (event: KeyboardEvent) {
  if (event.key === 'Shift') {
    if (event.type === 'keydown') {
      isShiftKeyPress.value = true
    } else if (event.type === 'keyup') {
      isShiftKeyPress.value = false
    }
  }
}

const filterList = computed(() => {
  return getGallery()
})

const isAllSelected = computed(() => {
  const values = Object.values(selectedList)
  if (values.length === 0) {
    return false
  } else {
    return filterList.value.every(item => {
      return selectedList[item.id!]
    })
  }
})

function getPicBeds (event: IpcRendererEvent, picBeds: IPicBedType[]) {
  picBed.value = picBeds
}

function getGallery (): IGalleryItem[] {
  if (searchText.value || selectedPicBed.value.length > 0) {
    return images.value
      .filter(item => {
        let isInSelectedPicBed = true
        let isIncludesSearchText = true
        if (selectedPicBed.value.length > 0) {
          isInSelectedPicBed = selectedPicBed.value.some(type => type === item.type)
        }
        if (searchText.value) {
          isIncludesSearchText = item.fileName?.includes(searchText.value) || false
        }
        return isIncludesSearchText && isInSelectedPicBed
      }).map(item => {
        return {
          ...item,
          src: item.imgUrl || '',
          key: (item.id || `${Date.now()}`),
          intro: item.fileName || ''
        }
      })
  } else {
    return images.value.map(item => {
      return {
        ...item,
        src: item.imgUrl || '',
        key: (item.id || `${Date.now()}`),
        intro: item.fileName || ''
      }
    })
  }
}

async function updateGallery () {
  images.value = (await $$db.get({ orderBy: 'desc' })).data
}

watch(() => filterList, () => {
  clearSelectedList()
})

function handleChooseImage (val: CheckboxValueType, index: number) {
  if (val === true) {
    handleBarActive.value = true
    if (lastSelected.value !== -1 && isShiftKeyPress.value) {
      const min = Math.min(lastSelected.value, index)
      const max = Math.max(lastSelected.value, index)
      for (let i = min + 1; i < max; i++) {
        const id = filterList.value[i].id!
        selectedList[id] = true
      }
    }
    lastSelected.value = index
  }
}

function clearSelectedList () {
  isShiftKeyPress.value = false
  Object.keys(selectedList).forEach(key => {
    selectedList[key] = false
  })
  lastSelected.value = -1
}

function zoomImage (index: number) {
  gallerySliderControl.index = index
  gallerySliderControl.visible = true
  changeZIndexForGallery(true)
}

function changeZIndexForGallery (isOpen: boolean) {
  if (isOpen) {
    // @ts-ignore
    document.querySelector('.main-content.el-row').style.zIndex = 101
  } else {
    // @ts-ignore
    document.querySelector('.main-content.el-row').style.zIndex = 10
  }
}

function handleClose () {
  gallerySliderControl.index = 0
  gallerySliderControl.visible = false
  changeZIndexForGallery(false)
}

async function copy (item: ImgInfo) {
  const copyLink = await ipcRenderer.invoke(PASTE_TEXT, getRawData(item))
  const obj = {
    title: $T('COPY_LINK_SUCCEED'),
    body: copyLink
    // sometimes will cause lagging
    // icon: item.url || item.imgUrl
  }
  const myNotification = new Notification(obj.title, obj)
  myNotification.onclick = () => {
    return true
  }
}

function remove (id?: string) {
  if (id) {
    $confirm($T('TIPS_REMOVE_LINK'), $T('TIPS_NOTICE'), {
      confirmButtonText: $T('CONFIRM'),
      cancelButtonText: $T('CANCEL'),
      type: 'warning'
    }).then(async () => {
      const file = await $$db.getById(id)
      await $$db.removeById(id)
      sendToMain('removeFiles', [file])
      const obj = {
        title: $T('OPERATION_SUCCEED'),
        body: ''
      }
      const myNotification = new Notification(obj.title, obj)
      myNotification.onclick = () => {
        return true
      }
      updateGallery()
    }).catch((e) => {
      console.log(e)
      return true
    })
  }
}

function openDialog (item: ImgInfo) {
  imgInfo.id = item.id!
  imgInfo.imgUrl = item.imgUrl as string
  dialogVisible.value = true
}

async function confirmModify () {
  await $$db.updateById(imgInfo.id, {
    imgUrl: imgInfo.imgUrl
  })
  const obj = {
    title: $T('CHANGE_IMAGE_URL_SUCCEED'),
    body: imgInfo.imgUrl
    // icon: this.imgInfo.imgUrl
  }
  const myNotification = new Notification(obj.title, obj)
  myNotification.onclick = () => {
    return true
  }
  dialogVisible.value = false
  updateGallery()
}

function cleanSearch () {
  searchText.value = ''
}

function toggleSelectAll () {
  const result = !isAllSelected.value
  filterList.value.forEach(item => {
    selectedList[item.id!] = result
  })
}

function selectMore () {
  sendRPC(IRPCActionType.GET_GALLERY_MENU_LIST, filterList.value.filter(item => {
    return selectedList[item.id!]
  }))
}

function multiRemove () {
  // selectedList -> { [id]: true or false }; true means selected. false means not selected.
  const multiRemoveNumber = Object.values(selectedList).filter(item => item).length
  if (multiRemoveNumber) {
    $confirm($T('TIPS_WILL_REMOVE_CHOOSED_IMAGES', {
      m: multiRemoveNumber
    }), $T('TIPS_NOTICE'), {
      confirmButtonText: $T('CONFIRM'),
      cancelButtonText: $T('CANCEL'),
      type: 'warning'
    }).then(async () => {
      const files: IResult<ImgInfo>[] = []
      const imageIDList = Object.keys(selectedList)
      for (let i = 0; i < imageIDList.length; i++) {
        const key = imageIDList[i]
        if (selectedList[key]) {
          const file = await $$db.getById<ImgInfo>(key)
          if (file) {
            files.push(file)
            await $$db.removeById(key)
          }
        }
      }
      clearSelectedList()
      // TODO: check this
      // selectedList = {} // 只有删除才能将这个置空
      const obj = {
        title: $T('OPERATION_SUCCEED'),
        body: ''
      }
      sendToMain('removeFiles', files)
      const myNotification = new Notification(obj.title, obj)
      myNotification.onclick = () => {
        return true
      }
      updateGallery()
    }).catch(() => {
      return true
    })
  }
}

async function multiCopy () {
  if (Object.values(selectedList).some(item => item)) {
    const copyString: string[] = []
    // selectedList -> { [id]: true or false }; true means selected. false means not selected.
    const imageIDList = Object.keys(selectedList)
    for (let i = 0; i < imageIDList.length; i++) {
      const key = imageIDList[i]
      if (selectedList[key]) {
        const item = await $$db.getById<ImgInfo>(key)
        if (item) {
          const txt = await ipcRenderer.invoke(PASTE_TEXT, getRawData(item))
          copyString.push(txt)
          selectedList[key] = false
        }
      }
    }
    const obj = {
      title: $T('BATCH_COPY_LINK_SUCCEED'),
      body: copyString.join('\n')
    }
    const myNotification = new Notification(obj.title, obj)
    clipboard.writeText(copyString.join('\n'))
    myNotification.onclick = () => {
      return true
    }
  }
}

function toggleHandleBar () {
  handleBarActive.value = !handleBarActive.value
}

async function handlePasteStyleChange (val: string) {
  saveConfig('settings.pasteStyle', val)
  pasteStyle.value = val
}

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners('updateGallery')
  ipcRenderer.removeListener(GET_PICBEDS, getPicBeds)
})

onActivated(async () => {
  pasteStyle.value = (await getConfig('settings.pasteStyle')) || 'markdown'
})

</script>
<script lang="ts">
export default {
  name: 'GalleryPage'
}
</script>
<style lang='stylus'>
.PhotoSlider
  &__BannerIcon
    &:nth-child(1)
      display none
  &__Counter
    margin-top 20px
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
  .sub-title
    font-size 14px
  .el-icon-caret-bottom
    cursor: pointer
    transition all .2s ease-in-out
    &.active
      transform: rotate(180deg)
#gallery-view
  height 100%
  .cursor-pointer
    cursor pointer
#gallery-view
  position relative
  .round
    border-radius 14px
  .pull-right
    float right
  .gallery-list
    height 360px
    box-sizing border-box
    padding 8px 0
    overflow-y auto
    overflow-x hidden
    position absolute
    top: 38px
    transition all .2s ease-in-out .1s
    width 100%
    &.small
      height: 287px
      top: 113px
    &__img
      // height 150px
      position relative
      margin-bottom 8px
    &__item
      width 100%
      height 120px
      transition all .2s ease-in-out
      cursor pointer
      margin-bottom 4px
      overflow hidden
      display flex
      margin-bottom 6px
      &-fake
        position absolute
        top 0
        left 0
        opacity 0
        width 100%
        z-index -1
      &:hover
        transform scale(1.1)
      &-img
        width 100%
        object-fit contain
    &__tool-panel
      color #ddd
      margin-bottom 4px
      display flex
      .el-checkbox
        height 16px
      i
        cursor pointer
        transition all .2s ease-in-out
        margin-right 4px
        &.document
          &:hover
            color #49B1F5
        &.edit
          &:hover
            color #69C282
        &.delete
          &:hover
            color #F15140
    &__file-name
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
      color #ddd
      font-size 14px
      margin-bottom 4px
  .handle-bar
    color #ddd
    margin-bottom 10px
</style>
