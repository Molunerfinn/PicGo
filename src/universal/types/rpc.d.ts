
type IGetUploaderConfigListArgs = [type: string]
type IDeleteUploaderConfigArgs = [type: string, id: string]
type ISelectUploaderConfigArgs = [type: string, id: string]
type IUpdateUploaderConfigArgs = [type: string, id: string, config: IStringKeyMap]
type IGetLatestVersionArgs = [isCheckBetaVersion: boolean]
type IToolboxCheckArgs = [type: import('./enum').IToolboxItemType]
type IOpenFileArgs = [filePath: string]
type ICopyTextArgs = [text: string]
type IShowDockIconArgs = [visible: boolean]
type IGetGalleryMenuListArgs = [selectedList: IGalleryItem[]]

interface IRPCServer {
  start: () => void
  stop: () => void
  use: (routes: IRPCRoutes) => void
}

type IRPCRoutes = Map<import('./enum').IRPCActionType, IRPCHandler<any>>

type IRPCHandler<T> = (args: any[], event: import('electron').IpcMainEvent) => Promise<T>

interface IRPCRouter {
  add<T>(action: import('./enum').IRPCActionType, handler: IRPCHandler<T>): IRPCRouter
  routes: () => IRPCRoutes
}

type IToolboxChecker<T = any> = (event: import('electron').IpcMainEvent) => Promise<T>

type IToolboxCheckerMap<T extends import('./enum').IToolboxItemType> = {
  [type in T]: IToolboxChecker
}

type IToolboxFixMap<T extends import('./enum').IToolboxItemType> = {
  [type in T]: IToolboxChecker<IToolboxCheckRes>
}

type IToolboxCheckRes = {
  type: import('./enum').IToolboxItemType
  status: import('./enum').IToolboxItemCheckStatus,
  msg?: string
  value?: any
}
