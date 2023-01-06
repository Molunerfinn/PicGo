import mitt from 'mitt'
import {
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE,
  FORCE_UPDATE
} from '~/universal/events/constants'

type IEvent ={
  [SHOW_INPUT_BOX_RESPONSE]: string
  [SHOW_INPUT_BOX]: {
    value: string
    title: string
    placeholder: string
  },
  [FORCE_UPDATE]: void
}

const emitter = mitt<IEvent>()

export default emitter
