import { trimValues } from '#/utils/common'
import picgo from '@core/picgo'
import { v4 as uuid } from 'uuid'

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

export const completeUploaderMetaConfig = (originData: IStringKeyMap): IUploaderConfigListItem => {
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

export const changeCurrentUploader = (type: string, config?: IStringKeyMap, id?: string) => {
  if (!type) {
    return
  }
  if (id) {
    picgo.saveConfig({
      [`uploader.${type}.defaultId`]: id
    })
  }
  if (config) {
    picgo.saveConfig({
      [`picBed.${type}`]: config
    })
  }
  picgo.saveConfig({
    'picBed.current': type,
    'picBed.uploader': type
  })
}

export const selectUploaderConfig = (type: string, id: string) => {
  const { configList } = getUploaderConfigList(type)
  const config = configList.find((item: IStringKeyMap) => item._id === id)
  if (config) {
    picgo.saveConfig({
      [`uploader.${type}.defaultId`]: id,
      [`picBed.${type}`]: config
    })
  }
}

export const getUploaderConfigList = (type: string): IUploaderConfigItem => {
  if (!type) {
    return {
      configList: [],
      defaultId: ''
    }
  }
  const currentUploaderConfig = picgo.getConfig<IStringKeyMap>(`uploader.${type}`) ?? {}
  let configList = currentUploaderConfig.configList
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
export const deleteUploaderConfig = (type: string, id: string): IUploaderConfigItem | void => {
  const { configList, defaultId } = getUploaderConfigList(type)
  if (configList.length <= 1) {
    return
  }
  let newDefaultId = defaultId
  const updatedConfigList = configList.filter((item: IStringKeyMap) => item._id !== id)
  if (id === defaultId) {
    newDefaultId = updatedConfigList[0]._id
    changeCurrentUploader(type, updatedConfigList[0], updatedConfigList[0]._id)
  }
  picgo.saveConfig({
    [`uploader.${type}.configList`]: updatedConfigList
  })
  return {
    configList: updatedConfigList,
    defaultId: newDefaultId
  }
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

export const updateUploaderConfig = (type: string, id: string, config: IStringKeyMap) => {
  const { configList, defaultId } = getUploaderConfigList(type)
  const existConfig = configList.find((item: IStringKeyMap) => item._id === id)
  let updatedConfig: IUploaderConfigListItem
  let updatedDefaultId = defaultId
  if (existConfig) {
    updatedConfig = Object.assign(existConfig, trimValues(config), {
      _updatedAt: Date.now()
    })
  } else {
    updatedConfig = completeUploaderMetaConfig(config)
    updatedDefaultId = updatedConfig._id
    configList.push(updatedConfig)
  }
  picgo.saveConfig({
    [`uploader.${type}.configList`]: configList,
    [`uploader.${type}.defaultId`]: updatedDefaultId,
    [`picBed.${type}`]: updatedConfig
  })
}
