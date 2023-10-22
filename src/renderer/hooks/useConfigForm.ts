import { cloneDeep, union } from 'lodash'
/**
 *
 * @param configList origin config list
 * @param formModel el-form form model for default value
 * @param currentConfig current config
 * @param resetConfigForm reset form model -> clear default value
 * @returns transformed config list
 */
export const useConfigForm = () => {
  return (configList: IPicGoPluginConfig[], formModel: IStringKeyMap, currentConfig?: IStringKeyMap, resetConfigForm?: boolean) => {
    if (configList.length > 0) {
      return cloneDeep(configList).map((item) => {
        // if (!configId) return item
        if (resetConfigForm) return item
        let defaultValue = item.default !== undefined
          ? item.default
          : item.type === 'checkbox'
            ? []
            : null
        if (item.type === 'checkbox') {
          const defaults = item.choices?.filter((i: any) => {
            return i.checked
          }).map((i: any) => i.value) || []
          defaultValue = union(defaultValue, defaults)
        }
        if (currentConfig && currentConfig[item.name] !== undefined) {
          defaultValue = currentConfig[item.name]
        }
        formModel[item.name] = defaultValue
        return item
      })
    }
    return []
  }
}
