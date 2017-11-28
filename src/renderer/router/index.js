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
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
