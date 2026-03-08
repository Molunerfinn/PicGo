import { getCurrentInstance, reactive, UnwrapNestedRefs, watch } from 'vue'

/**
 * v-model for multiple props
 */
export function useVModelValues<T extends object> (props: T, keys: Array<keyof T>) {
  const vm = getCurrentInstance()
  const obj = {} as T
  keys.forEach(key => {
    obj[key] = props[key]
  })
  const mutableValue = reactive(obj) as T

  watch(() => props, (val) => {
    keys.forEach(key => {
      mutableValue[key] = val[key]
    })
  }, {
    deep: true
  })

  function updateProps () {
    for (const key of keys) {
      vm?.emit(`update:${key as string}`, mutableValue[key])
    }
  }

  return [mutableValue as UnwrapNestedRefs<T>, updateProps] as const
}
