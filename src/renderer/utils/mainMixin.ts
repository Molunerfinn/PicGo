import { ComponentOptions } from 'vue'
import { FORCE_UPDATE, GET_PICBEDS } from '~/universal/events/constants'
import bus from '~/renderer/utils/bus'
import { ipc } from './bridge'
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
      ipc.send(GET_PICBEDS)
    }
  }
}
