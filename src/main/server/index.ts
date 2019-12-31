import http from 'http'
import routers from './routerManager'
import {
  handleResponse
} from './utils'

class Server {
  private httpServer: http.Server
  private port: number = 36677
  constructor () {
    this.httpServer = http.createServer(this.handleRequest)
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
            postObj = JSON.parse(body)
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
    console.log(`server listen at ${port}`)
    this.httpServer.listen(port).on('error', (err: ErrnoException) => {
      if (err.errno === 'EADDRINUSE') {
        console.log(`----- Port ${port} is busy, trying with port ${port + 1} -----`)
        this.port += 1
        this.listen(this.port)
      }
    })
  }
  startup () {
    this.listen(this.port)
  }
  shutdown () {
    this.httpServer.close()
  }
}

export default new Server()
