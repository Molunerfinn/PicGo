import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'tray-page',
      component: () => import(/* webpackChunkName: "tray" */ '@/pages/TrayPage.vue')
    },
    {
      path: '/rename-page',
      name: 'rename-page',
      component: () => import(/* webpackChunkName: "RenamePage" */ '@/pages/RenamePage.vue')
    },
    {
      path: '/mini-page',
      name: 'mini-page',
      component: () => import(/* webpackChunkName: "MiniPage" */ '@/pages/MiniPage.vue')
    },
    {
      path: '/main-page',
      name: 'main-page',
      component: () => import(/* webpackChunkName: "SettingPage" */ '@/layouts/Main.vue'),
      children: [
        {
          path: 'upload',
          component: () => import(/* webpackChunkName: "Upload" */ '@/pages/Upload.vue'),
          name: 'upload'
        },
        {
          path: 'picbeds/:type/:configId',
          component: () => import(/* webpackChunkName: "Other" */ '@/pages/picbeds/index.vue'),
          name: 'picbeds'
        },
        {
          path: 'gallery',
          component: () => import(/* webpackChunkName: "Gallery" */ '@/pages/Gallery.vue'),
          name: 'gallery',
          meta: {
            keepAlive: true
          }
        },
        {
          path: 'setting',
          component: () => import(/* webpackChunkName: "setting" */ '@/pages/PicGoSetting.vue'),
          name: 'setting'
        },
        {
          path: 'plugin',
          component: () => import(/* webpackChunkName: "Plugin" */ '@/pages/Plugin.vue'),
          name: 'plugin'
        },
        {
          path: 'shortKey',
          component: () => import(/* webpackChunkName: "ShortkeyPage" */ '@/pages/ShortKey.vue'),
          name: 'shortKey'
        },
        {
          path: 'uploader-config-page/:type',
          component: () => import(/* webpackChunkName: "Other" */ '@/pages/UploaderConfigPage.vue'),
          name: 'UploaderConfigPage'
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
