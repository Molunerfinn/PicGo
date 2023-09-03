import { IPicGo } from 'picgo'
import { replaceHost } from '~/main/utils/common'

export const galleryMenu = () => {
  return [{
    label: '修改相册 host',
    async handle (ctx: IPicGo, guiApi: IGuiApi, selectedList: ImgInfo[]) {
      const config: IPicGoPluginConfig[] = [
        {
          alias: 'Selected Host',
          name: 'selectedHost',
          type: 'select',
          choices: [],
          required: true
        },
        {
          alias: 'New host',
          name: 'newHost',
          type: 'input',
          default: '',
          required: true
        }
      ]
      const options: IPicGoPluginShowConfigDialogOption = {
        title: '修改相册 host',
        config
      }
      const res = await guiApi.showConfigDialog<{
        selectedHost: string[]
        newHost: string
      }>(options)

      if (res) {
        const selectedHost = res.selectedHost
        const changedList = selectedList.map((item) => {
          try {
            const url = new URL(item.imgUrl || '')
            const host = url.host
            if (selectedHost.includes(host)) {
              item.imgUrl = replaceHost(item.imgUrl!, host, res.newHost)
              return item
            } else {
              return false
            }
          } catch (e: any) {
            ctx.log.error(e)
            return false
          }
        }).filter(Boolean) as ImgInfo[]
        // await guiApi.galleryDB.overwrite(changedList)
        console.log(changedList)
      }
    }
  }]
}
