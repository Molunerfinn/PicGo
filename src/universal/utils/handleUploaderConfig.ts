import { uuid } from 'uuidv4'
import { trimValues } from '#/utils/common'
import picgo from '@core/picgo'

export const handleConfigWithFunction = (config: IPicGoPluginOriginConfig[]): IPicGoPluginConfig[] => {
  for (const i in config) {
    if (typeof config[i].default === 'function') {
      config[i].default = config[i].default()
    }
    if (typeof config[i].choices === 'function') {
      config[i].choices = (config[i].choices as Function)()
    }
  }
  return config as IPicGoPluginConfig[]
}

export const completeUploaderMetaConfig = (originData: IStringKeyMap): IStringKeyMap => {
  return Object.assign({
    _configName: 'Default'
  }, trimValues(originData), {
    _id: uuid(),
    _createdAt: Date.now(),
    _updatedAt: Date.now()
  })
}

/**
 * get picbed config by type
 * it will trigger the uploader config function & get the uploader config result
 * & not just read from
 */
export const getPicBedConfig = (type: string) => {
  const name = picgo.helper.uploader.get(type)?.name || type
  if (picgo.helper.uploader.get(type)?.config) {
    const _config = picgo.helper.uploader.get(type)!.config!(picgo)
    const config = handleConfigWithFunction(_config)
    return {
      config,
      name
    }
  } else {
    return {
      config: [],
      name
    }
  }
}

export const changeCurrentUploader = (type: string, config: IStringKeyMap, id?: string) => {
  if (!type || !config) {
    return
  }
  if (id) {
    picgo.saveConfig({
      [`uploader.${type}.defaultId`]: id
    })
  }
  picgo.saveConfig({
    'picBed.current': type,
    'picBed.uploader': type,
    [`picBed.${type}`]: config
  })
}

export const getUploaderConfigList = (type: string) => {
  const currentUploaderConfig = picgo.getConfig<IStringKeyMap>(`uploader.${type}`) ?? {}
  let configList = currentUploaderConfig.configList || []
  let defaultId = currentUploaderConfig.defaultId || ''
  if (!configList) {
    const res = upgradeUploaderConfig(type)
    configList = res.configList
    defaultId = res.defaultId
  }
  return {
    configList,
    defaultId
  }
}

/**
 * delete uploader config by type & id
 */
export const deleteUploaderConfig = (type: string, id: string) => {
  const { configList, defaultId } = getUploaderConfigList(type)
  if (configList.length <= 1) {
    return
  }
  const updatedConfigList = configList.filter((item: IStringKeyMap) => item._id !== id)
  if (id === defaultId) {
    changeCurrentUploader(type, updatedConfigList[0], updatedConfigList[0]._id)
  }
  picgo.saveConfig({
    [`uploader.${type}.configList`]: updatedConfigList
  })
}

/**
 * upgrade old uploader config to new format
 */
export const upgradeUploaderConfig = (type: string): {
  configList: IStringKeyMap[]
  defaultId: string
} => {
  const uploaderConfig = picgo.getConfig<IStringKeyMap>(`picBed.${type}`) ?? {}
  if (!uploaderConfig._id) {
    Object.assign(uploaderConfig, completeUploaderMetaConfig(uploaderConfig))
  }

  const uploaderConfigList = [uploaderConfig]
  picgo.saveConfig({
    [`uploader.${type}`]: {
      configList: uploaderConfigList,
      defaultId: uploaderConfig._id
    },
    [`picBed.${type}`]: uploaderConfig
  })
  return {
    configList: uploaderConfigList,
    defaultId: uploaderConfig._id
  }
}
