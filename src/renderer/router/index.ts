import { createRouter, createWebHashHistory } from 'vue-router'
import * as config from './config'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: config.TRAY_PAGE,
      component: () => import(/* webpackChunkName: "tray" */ '@/pages/TrayPage.vue')
    },
    {
      path: '/rename-page',
      name: config.RENAME_PAGE,
      component: () => import(/* webpackChunkName: "RenamePage" */ '@/pages/RenamePage.vue')
    },
    {
      path: '/mini-page',
      name: config.MINI_PAGE,
      component: () => import(/* webpackChunkName: "MiniPage" */ '@/pages/MiniPage.vue')
    },
    {
      path: '/main-page',
      name: config.MAIN_PAGE,
      component: () => import(/* webpackChunkName: "SettingPage" */ '@/layouts/Main.vue'),
      children: [
        {
          path: 'upload',
          component: () => import(/* webpackChunkName: "Upload" */ '@/pages/Upload.vue'),
          name: config.UPLOAD_PAGE
        },
        {
          path: 'picbeds/:type/:configId?',
          component: () => import(/* webpackChunkName: "Other" */ '@/pages/picbeds/index.vue'),
          name: config.PICBEDS_PAGE
        },
        {
          path: 'gallery',
          component: () => import(/* webpackChunkName: "GalleryView" */ '@/pages/Gallery.vue'),
          name: config.GALLERY_PAGE,
          meta: {
            keepAlive: true
          }
        },
        {
          path: 'setting',
          component: () => import(/* webpackChunkName: "setting" */ '@/pages/PicGoSetting.vue'),
          name: config.SETTING_PAGE
        },
        {
          path: 'plugin',
          component: () => import(/* webpackChunkName: "Plugin" */ '@/pages/Plugin.vue'),
          name: config.PLUGIN_PAGE
        },
        {
          path: 'shortKey',
          component: () => import(/* webpackChunkName: "ShortkeyPage" */ '@/pages/ShortKey.vue'),
          name: config.SHORTKEY_PAGE
        },
        {
          path: 'uploader-config-page/:type',
          component: () => import(/* webpackChunkName: "Other" */ '@/pages/UploaderConfigPage.vue'),
          name: config.UPLOADER_CONFIG_PAGE
        }
      ]
    },
    {
      path: '/toolbox-page',
      name: config.TOOLBOX_CONFIG_PAGE,
      component: () => import(/* webpackChunkName: "ToolboxPage" */ '@/pages/Toolbox.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
