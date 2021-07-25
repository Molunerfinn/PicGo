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
          path: 'qiniu',
          component: () => import(/* webpackChunkName: "Qiniu" */ '@/pages/picbeds/Qiniu.vue'),
          name: 'qiniu'
        },
        {
          path: 'tcyun',
          component: () => import(/* webpackChunkName: "TcYun" */ '@/pages/picbeds/TcYun.vue'),
          name: 'tcyun'
        },
        {
          path: 'upyun',
          component: () => import(/* webpackChunkName: "UpYun" */ '@/pages/picbeds/UpYun.vue'),
          name: 'upyun'
        },
        {
          path: 'github',
          component: () => import(/* webpackChunkName: "GitHub" */ '@/pages/picbeds/GitHub.vue'),
          name: 'github'
        },
        {
          path: 'smms',
          component: () => import(/* webpackChunkName: "SMMS" */ '@/pages/picbeds/SMMS.vue'),
          name: 'smms'
        },
        {
          path: 'aliyun',
          component: () => import(/* webpackChunkName: "AliYun" */ '@/pages/picbeds/AliYun.vue'),
          name: 'aliyun'
        },
        {
          path: 'imgur',
          component: () => import(/* webpackChunkName: "Imgur" */ '@/pages/picbeds/Imgur.vue'),
          name: 'imgur'
        },
        {
          path: 'others/:type',
          component: () => import(/* webpackChunkName: "Other" */ '@/pages/picbeds/Others.vue'),
          name: 'others'
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
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
