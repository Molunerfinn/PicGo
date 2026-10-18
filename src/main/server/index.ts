import crypto from 'crypto'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import windowManager from 'apis/app/window/windowManager'
import {
  uploadClipboardFilesWithInfo,
  uploadSelectedFilesWithInfo
} from 'apis/app/uploader/apis'
import { getFormImageFolderPath } from 'apis/core/datastore/dbChecker'
import type { IInternalServerManager, IServerUploadAdapter } from 'picgo/dist/types/internal'

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
      // Backfill a secret for configs saved before auth was required by
      // default. An empty/missing secret is treated by picgo-core as
      // "authentication disabled", which lets any web page the user visits
      // reach this always-on localhost server (CORS on /upload is
      // unrestricted) and make it read arbitrary local files via the
      // "list" upload parameter.
      if (!config.secret || !config.secret.trim()) {
        config = { ...config, secret: crypto.randomBytes(24).toString('hex') }
        picgo.saveConfig({
          'settings.server': config
        })
      }
      return config
    }

    config = {
      port: 36677,
      host: '127.0.0.1',
      enable: true,
      // Generate a per-install random secret so the server requires
      // authentication from its first run, instead of shipping with
      // authentication disabled by default.
      secret: crypto.randomBytes(24).toString('hex')
    }
    picgo.saveConfig({
      'settings.server': config
    })
    return config
  }

  private ensureUploadAdapterInstalled () {
    if (this.hasInstalledUploadAdapter) return
    const server = picgo.server as IInternalServerManager
    const uploadAdapter: IServerUploadAdapter = {
      uploadClipboard: async (options) => await uploadClipboardFilesWithInfo(options),
      uploadPaths: async (paths, options) => {
        const win = windowManager.getAvailableWindow()
        return await uploadSelectedFilesWithInfo(win.webContents, paths.map(item => ({ path: item })), options)
      },
      getTempDir: getFormImageFolderPath
    }
    server.setUploadAdapter(uploadAdapter)
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
