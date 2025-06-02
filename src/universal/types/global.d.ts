
// https://stackoverflow.com/questions/35074713/extending-typescript-global-object-in-node-js/44387594#44387594
declare var PICGO_GUI_VERSION: string
declare var PICGO_CORE_VERSION: string
declare var notificationList: IAppNotification[]

declare module 'epipebomb' {
  export default function epipebomb(stream: NodeJS.Process['stdout'], callback: () => void): void
}

// 扩展原生 IncomingMessage，添加 multer 字段
declare module 'http' {
  interface IncomingMessage {
    files?: {
      path: string;
      originalname: string;
      mimetype: string;
      size: number;
      [key: string]: any;
    }[];
    body?: any;
  }
}
