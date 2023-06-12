import { IRPCActionType } from '~/universal/types/enum'

export class RPCRouter implements IRPCRouter {
  private routeMap: IRPCRoutes = new Map()
  add = <T>(action: IRPCActionType, handler: IRPCHandler<T>) => {
    this.routeMap.set(action, handler)
    return this
  }

  routes () {
    return this.routeMap
  }
}
