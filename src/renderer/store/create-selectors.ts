import type { StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & {
    use: {
      [K in keyof T]: () => T[K]
    }
  }
  : never

export function createSelectors<S extends UseBoundStore<StoreApi<object>>> (
  baseStore: S
) {
  const store = baseStore as WithSelectors<S>
  const selectors = {} as WithSelectors<S>['use']
  const mutableSelectors = selectors as unknown as Record<string, () => unknown>
  const stateKeys = Object.keys(store.getState()) as Array<keyof ReturnType<S['getState']>>

  stateKeys.forEach((key) => {
    mutableSelectors[String(key)] = () =>
      store((state) => state[key as keyof typeof state])
  })

  store.use = selectors

  return store
}
