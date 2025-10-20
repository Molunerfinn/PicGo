import { createApp } from 'vue'
import App from './APP.vue'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import 'tailwindcss/tailwind.css'
import axios from 'axios'

const messages = {
  en,
  'zh-CN': zhCN
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

const app = createApp(App)
app.use(i18n)
app.config.globalProperties.$http = axios
app.mount('#app')
