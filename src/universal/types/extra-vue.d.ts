import VueRouter, { Route } from 'vue-router'
import db from '#/datastore'
import axios from 'axios'
declare module 'vue/types/vue' {
  interface Vue {
    $router: VueRouter,
    $route: Route,
    $db: typeof db
    $http: typeof axios
    $builtInPicBed: string[]
  }
}
