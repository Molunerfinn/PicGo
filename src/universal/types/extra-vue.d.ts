import Vue from 'vue'
import axios from 'axios'

declare module 'vue/types/vue' {
  interface Vue {
    $router: VueRouter
    $route: Route
    $http: typeof axios
    $builtInPicBed: string[]
    $bus: Vue
    $$db: IGalleryDB
    saveConfig(data: IObj | string, value?: any): void
    getConfig<T>(key?: string): Promise<T | undefined>
  }
}
