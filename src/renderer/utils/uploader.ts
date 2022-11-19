import { uuid } from 'uuidv4'

export const completeUploaderMetaConfig = (originData: IStringKeyMap): IStringKeyMap => {
  return Object.assign({}, originData, {
    _id: uuid(),
    _configName: 'Default',
    _createdAt: Date.now(),
    _updatedAt: Date.now()
  })
}
