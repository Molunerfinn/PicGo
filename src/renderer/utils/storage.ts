export interface IRendererStorage {
  getItem<T> (key: string, fallbackValue: T): Promise<T>
  setItem<T> (key: string, value: T): Promise<void>
  removeItem (key: string): Promise<void>
}

const localRendererStorage: IRendererStorage = {
  async getItem<T> (key: string, fallbackValue: T): Promise<T> {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) {
        return fallbackValue
      }

      return JSON.parse(raw) as T
    } catch (error) {
      console.error(error)
      return fallbackValue
    }
  },
  async setItem<T> (key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(error)
    }
  },
  async removeItem (key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(error)
    }
  }
}

export const rendererStorage = localRendererStorage
