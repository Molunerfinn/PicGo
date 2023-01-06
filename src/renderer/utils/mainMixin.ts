import { ComponentOptions, getCurrentInstance } from 'vue'
import { FORCE_UPDATE, GET_PICBEDS } from '~/universal/events/constants'
import bus from '~/renderer/utils/bus'
import { ipcRenderer } from 'electron'
export const mainMixin: ComponentOptions = {
  created () {
    bus.on(FORCE_UPDATE, () => {
      getCurrentInstance()?.proxy?.$forceUpdate()
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
