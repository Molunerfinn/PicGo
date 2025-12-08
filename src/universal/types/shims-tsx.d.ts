import Vue, { VNode } from 'vue'

declare global {
  interface ElectronApi {
    getFilePath: (file: File) => string
  }

  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any
    }
  }

  interface Window {
    electronApi: ElectronApi
    TDAPP: {
      onEvent: (EventId: string, Label?: string, MapKv?: IStringKeyMap) => void
    }
  }
}
