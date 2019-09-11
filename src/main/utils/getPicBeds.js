import path from 'path'
import db from '../../datastore'
// eslint-disable-next-line
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

const getPicBeds = (app) => {
  const PicGo = requireFunc('picgo')
  const STORE_PATH = app.getPath('userData')
  const CONFIG_PATH = path.join(STORE_PATH, '/data.json')
  const picgo = new PicGo(CONFIG_PATH)
  const picBedTypes = picgo.helper.uploader.getIdList()
  const picBedFromDB = db.get('picBed.list') || []
  const picBeds = picBedTypes.map(item => {
    const visible = picBedFromDB.find(i => i.type === item) // object or undefined
    return {
      type: item,
      name: picgo.helper.uploader.get(item).name || item,
      visible: visible ? visible.visible : true
    }
  })
  picgo.cmd.program.removeAllListeners()
  return picBeds
}

export {
  getPicBeds
}
