import logger from '@core/picgo/logger'
class ShortKeyService {
  private commandList: Map<string, IShortKeyHandler> = new Map()
  registerCommand (command: string, handler: IShortKeyHandler) {
    this.commandList.set(command, handler)
  }

  unregisterCommand (command: string) {
    this.commandList.delete(command)
  }

  getShortKeyHandler (command: string): IShortKeyHandler | null {
    const handler = this.commandList.get(command)
    if (handler) return handler
    logger.warn(`cannot find command: ${command}`)
    return null
  }

  getCommandList () {
    return [...this.commandList.keys()]
  }
}

export default new ShortKeyService()
