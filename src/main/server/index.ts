import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import {
  uploadClipboardFilesWithInfo,
  uploadSelectedFilesWithInfo
} from 'apis/app/uploader/apis'
import { getFormImageFolderPath } from 'apis/core/datastore/dbChecker'
import type { IInternalServerManager } from 'picgo/dist/types/internal'

class Server {
  private config: IServerConfig
  private hasInstalledUploadAdapter = false
  constructor () {
    this.config = this.ensureConfig()
  }

  private checkIfConfigIsValid (config: IObj | undefined) {
    if (config && config.port && config.host && (config.enable !== undefined)) {
      return true
    } else {
      return false
    }
  }

  private ensureConfig (): IServerConfig {
    let config = picgo.getConfig<IServerConfig>('settings.server')
    if (this.checkIfConfigIsValid(config)) {
      return config
    }

    config = {
      port: 36677,
      host: '127.0.0.1',
      enable: true
    }
    picgo.saveConfig({
      'settings.server': config
    })
    return config
  }

  private ensureUploadAdapterInstalled () {
    if (this.hasInstalledUploadAdapter) return
    const server = picgo.server as IInternalServerManager
    server.setUploadAdapter({
      uploadClipboard: async () => await uploadClipboardFilesWithInfo(),
      uploadPaths: async (paths: string[]) => {
        const win = windowManager.getAvailableWindow()
        return await uploadSelectedFilesWithInfo(win.webContents, paths.map(item => ({ path: item })))
      },
      getTempDir: getFormImageFolderPath
    })
    this.hasInstalledUploadAdapter = true
  }

  startup () {
    this.config = this.ensureConfig()
    if (this.config.enable) {
      this.ensureUploadAdapterInstalled()
      // let core resolve config defaults when possible, but preserve GUI config semantics.
      const port = typeof this.config.port === 'string' ? parseInt(this.config.port, 10) : this.config.port
      picgo.server.listen(port, this.config.host)
    }
  }

  shutdown () {
    picgo.server.shutdown()
    logger.info('[PicGo Server] shutdown')
  }

  restart () {
    this.shutdown()
    this.startup()
  }
}

export default new Server()
