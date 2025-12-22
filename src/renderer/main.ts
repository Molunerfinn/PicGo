import './assets/css/tailwind.css'
import { createApp } from 'vue'
import { webFrame } from 'electron'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-plus'
import 'element-plus/dist/index.css'
import VueLazyLoad from 'vue3-lazyload'
import axios from 'axios'
import { mainMixin } from './utils/mainMixin'
import { dragMixin } from '@/utils/mixin'
import { initTalkingData } from './utils/analytics'
import db from './utils/db'
import { i18nManager, T } from './i18n/index'
import { getConfig, saveConfig, sendToMain, triggerRPC } from '@/utils/dataSender'
import { store } from '@/store'
import vue3PhotoPreview from 'vue3-photo-preview'
import 'vue3-photo-preview/dist/index.css'
import { getRendererStaticFileUrl } from './utils/static'

webFrame.setVisualZoomLevelLimits(1, 1)

const app = createApp(App)

app.config.globalProperties.$builtInPicBed = [
  'smms',
  'imgur',
  'qiniu',
  'tcyun',
  'upyun',
  'aliyun',
  'github'
]

app.config.globalProperties.$$db = db
app.config.globalProperties.$http = axios
app.config.globalProperties.$T = T
app.config.globalProperties.$i18n = i18nManager
app.config.globalProperties.getConfig = getConfig
app.config.globalProperties.triggerRPC = triggerRPC
app.config.globalProperties.saveConfig = saveConfig
app.config.globalProperties.sendToMain = sendToMain

app.mixin(mainMixin)
app.mixin(dragMixin)

app.use(VueLazyLoad, {
  error: getRendererStaticFileUrl('unknown-file-type.svg')
})
app.use(ElementUI)
app.use(router)
app.use(store)
app.use(vue3PhotoPreview)

app.mount('#app')

initTalkingData()
