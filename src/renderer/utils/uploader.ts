import { uuid } from 'uuidv4'

export const completeUploaderMetaConfig = (originData: IStringKeyMap): IStringKeyMap => {
  return Object.assign({
    _configName: 'Default'
  }, originData, {
    _id: uuid(),
    _createdAt: Date.now(),
    _updatedAt: Date.now()
  })
}
