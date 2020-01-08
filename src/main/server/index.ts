import http from 'http'
import routers from './routerManager'
import {
  handleResponse
} from './utils'
import picgo from '~/main/utils/picgo'
import logger from '~/main/utils/logger'

class Server {
  private httpServer: http.Server
  private config: IServerConfig
  constructor () {
    let config = picgo.getConfig('settings.server')
    const result = this.checkIfConfigIsValid(config)
    if (result) {
      this.config = config
    } else {
      config = {
        port: 36677,
        host: '127.0.0.1',
        enable: true
      }
      this.config = config
      picgo.saveConfig({
        'settings.server': config
      })
    }
    this.httpServer = http.createServer(this.handleRequest)
  }
  private checkIfConfigIsValid (config: IObj | undefined) {
    if (config && config.port && config.host && (config.enable !== undefined)) {
      return true
    } else {
      return false
    }
  }
  private handleRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.method === 'POST') {
      if (!routers.getHandler(request.url!)) {
        handleResponse({
          response,
          statusCode: 404,
          header: {},
          body: {
            success: false
          }
        })
      } else {
        let body: string = ''
        let postObj: IObj
        request.on('data', chunk => {
          body += chunk
        })
        request.on('end', () => {
          try {
            postObj = (body === '') ? {} : JSON.parse(body)
          } catch (err) {
            return handleResponse({
              response,
              body: {
                success: false,
                message: 'Not sending data in JSON format'
              }
            })
          }
          const handler = routers.getHandler(request.url!)
          handler!({
            ...postObj,
            response
          })
        })
      }
    } else {
      response.statusCode = 404
      response.end()
    }
  }
  private listen = (port: number) => {
    logger.info(`[PicGo Server] is listening at ${port}`)
    this.httpServer.listen(port, this.config.host).on('error', (err: ErrnoException) => {
      if (err.errno === 'EADDRINUSE') {
        logger.warn(`[PicGo Server] ${port} is busy, trying with port ${port + 1}`)
        this.config.port += 1
        picgo.saveConfig({
          'settings.server': this.config
        })
        this.listen(this.config.port)
      }
    })
  }
  startup () {
    if (this.config.enable) {
      this.listen(this.config.port)
    }
  }
  shutdown () {
    this.httpServer.close()
    logger.info('[PicGo Server] shutdown')
  }
  restart () {
    this.config = picgo.getConfig('settings.server')
    this.shutdown()
    this.startup()
  }
}

export default new Server()
