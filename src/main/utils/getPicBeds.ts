import db from '#/datastore'
import picgo from './picgo'

const getPicBeds = () => {
  const picBedTypes = picgo.helper.uploader.getIdList()
  const picBedFromDB = db.get('picBed.list') || []
  const picBeds = picBedTypes.map((item: string) => {
    const visible = picBedFromDB.find((i: IPicBedType) => i.type === item) // object or undefined
    return {
      type: item,
      name: picgo.helper.uploader.get(item).name || item,
      visible: visible ? visible.visible : true
    }
  }) as IPicBedType[]
  picgo.cmd.program.removeAllListeners()
  return picBeds
}

export {
  getPicBeds
}
