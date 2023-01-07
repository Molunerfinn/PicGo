import { ComponentOptions } from 'vue'
import { FORCE_UPDATE, GET_PICBEDS } from '~/universal/events/constants'
import bus from '~/renderer/utils/bus'
import { ipcRenderer } from 'electron'
export const mainMixin: ComponentOptions = {
  inject: ['forceUpdateTime'],

  created () {
    // FIXME: may be memory leak
    this?.$watch('forceUpdateTime', (newVal: number, oldVal: number) => {
      if (oldVal !== newVal) {
        this?.$forceUpdate()
      }
    })
  },

  methods: {
    forceUpdate () {
      bus.emit(FORCE_UPDATE)
    },
    getPicBeds () {
      ipcRenderer.send(GET_PICBEDS)
    }
  }
}
