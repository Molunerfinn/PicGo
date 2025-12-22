import { networkInterfaceDefault } from 'systeminformation'
import { md5 } from './common'
import writeFile from 'write-file-atomic'
import { DEVICE_ID_PATH } from './env'
import fs from 'fs-extra'

class DeviceIdManager {
  private deviceId: string | null = null

  constructor() {
    this.init()
  }

  private async init() {
    await this.loadDeviceId()
  }

  private async getDeviceIdWithFallback(): Promise<string> {
    try {
      if (fs.existsSync(DEVICE_ID_PATH)) {
        const deviceId = await fs.readFile(DEVICE_ID_PATH, 'utf-8')
        if (deviceId && deviceId?.trim().length > 0) {
          return deviceId.trim()
        }
      }
      const netInterfaceMac = await networkInterfaceDefault()
      if (netInterfaceMac) {
        return md5(netInterfaceMac)
      } else {
        // random fallback
        return md5(`${new Date().getTime()}-${Math.random().toString(36).substring(2, 15)}`)
      }
    } catch (error) {
      // random fallback
      return md5(`${new Date().getTime()}-${Math.random().toString(36).substring(2, 15)}`)
    }
  }

  private async saveDeviceId(id: string): Promise<void> {
    try {
      await writeFile(DEVICE_ID_PATH, id, { encoding: 'utf-8' })
    } catch (error) {
      console.error('Failed to save device ID:', error)
    }
  }

  private async loadDeviceId(): Promise<string> {
    this.deviceId = await this.getDeviceIdWithFallback()
    await this.saveDeviceId(this.deviceId)
    return this.deviceId
  }

  public async getId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId
    }
    this.deviceId = await this.loadDeviceId()
    return this.deviceId
  }
}

export const deviceIdManager = new DeviceIdManager()
