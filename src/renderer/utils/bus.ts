import mitt from 'mitt'
import {
  SHOW_INPUT_BOX,
  SHOW_INPUT_BOX_RESPONSE,
  FORCE_UPDATE,
  APP_CONFIG_UPDATED
} from '~/universal/events/constants'

type IEvent ={
  [SHOW_INPUT_BOX_RESPONSE]: string
  [SHOW_INPUT_BOX]: IShowInputBoxOption,
  [FORCE_UPDATE]: void
  [APP_CONFIG_UPDATED]: void
}

const emitter = mitt<IEvent>()

export default emitter
