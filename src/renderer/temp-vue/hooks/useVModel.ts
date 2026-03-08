import { computed, getCurrentInstance } from 'vue'

export type VModelObject = object

/**
 * v-model for single prop
 */
export function useVModel<T extends VModelObject, K extends keyof T> (props: T, key: K) {
  const vm = getCurrentInstance()
  return computed({
    get: () => props[key],
    set: (value) => {
      vm?.emit(`update:${key as string}`, value)
    }
  })
}
