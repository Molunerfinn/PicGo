import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'tray-page',
      component: require('@/components/TrayPage').default
    },
    {
      path: '/rename-page',
      name: 'rename-page',
      component: require('@/components/RenamePage').default
    },
    {
      path: '/setting',
      name: 'setting-page',
      component: require('@/components/SettingPage').default,
      children: [
        {
          path: 'upload',
          component: require('@/components/SettingView/Upload').default,
          name: 'upload'
        },
        {
          path: 'weibo',
          component: require('@/components/SettingView/Weibo').default,
          name: 'weibo'
        },
        {
          path: 'qiniu',
          component: require('@/components/SettingView/Qiniu').default,
          name: 'qiniu'
        },
        {
          path: 'tcyun',
          component: require('@/components/SettingView/TcYun').default,
          name: 'tcyun'
        },
        {
          path: 'upyun',
          component: require('@/components/SettingView/UpYun').default,
          name: 'upyun'
        },
        {
          path: 'github',
          component: require('@/components/SettingView/GitHub').default,
          name: 'github'
        },
        {
          path: 'smms',
          component: require('@/components/SettingView/SMMS').default,
          name: 'smms'
        },
        {
          path: 'gallery',
          component: require('@/components/SettingView/Gallery').default,
          name: 'gallery'
        },
        {
          path: 'setting',
          component: require('@/components/SettingView/PicGoSetting').default,
          name: 'setting'
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
