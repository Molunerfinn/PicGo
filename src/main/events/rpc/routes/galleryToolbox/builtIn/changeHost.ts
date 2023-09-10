import { logger } from '@picgo/i18n'
import { IPicGo } from 'picgo'
import { T } from '~/main/i18n'
import { getHost, removeProtocolAndSuffix, replaceHost } from '~/main/utils/common'

export const galleryMenu = () => {
  return [{
    label: T('CHANGE_IMAGE_URL_HOST'),
    async handle (ctx: IPicGo, guiApi: IGuiApi, selectedList: ImgInfo[] = []) {
      const hostList = [...new Set(selectedList.map((item) => {
        return getHost(item.imgUrl)
      }).filter(Boolean) as string[])]
      if (hostList.length === 0) {
        guiApi.showNotification({
          title: T('CHANGE_IMAGE_URL_HOST'),
          body: T('CHANGE_IMAGE_URL_HOST_WARN')
        })
        logger.warn(T('CHANGE_IMAGE_URL_HOST_WARN'))
        return
      }
      const config: IPicGoPluginConfig[] = [
        {
          alias: T('SELECTED_IMAGE_URL_HOST'),
          name: 'selectedHost',
          type: 'checkbox',
          choices: hostList.map(item => ({
            name: item,
            value: item,
            checked: true
          })),
          required: true
        },
        {
          alias: T('NEW_IMAGE_URL_HOST'),
          name: 'newHost',
          type: 'input',
          message: 'www.example.com',
          default: '',
          required: true
        }
      ]
      const options: IPicGoPluginShowConfigDialogOption = {
        title: T('CHANGE_IMAGE_URL_HOST'),
        config
      }
      const res = await guiApi.showConfigDialog<{
        selectedHost: string[]
        newHost: string
      }>(options)

      if (res) {
        const selectedHost = res.selectedHost
        const newHost = removeProtocolAndSuffix(res.newHost)
        const changedList = selectedList.map((item) => {
          try {
            const url = new URL(item.imgUrl || '')
            const host = url.host
            if (selectedHost.includes(host)) {
              item.imgUrl = replaceHost(item.imgUrl!, host, newHost)
              return item
            } else {
              return false
            }
          } catch (e: any) {
            ctx.log.error(e)
            return false
          }
        }).filter(Boolean) as ImgInfo[]
        const updateRes = await guiApi.galleryDB.updateMany(changedList)
        guiApi.showNotification({
          title: T('CHANGE_IMAGE_URL_HOST_RESULT'),
          body: `${T('SUCCESS')}: ${updateRes.success} ${T('FAILED')}: ${updateRes.total - updateRes.success}}`
        })
      }
    }
  }]
}
