import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { Menu } from 'electron'
import getPicBeds from '~/main/utils/getPicBeds'
import picgo from '@core/picgo'
import { T } from '~/main/i18n'
import { changeCurrentUploader } from '~/main/utils/handleUploaderConfig'

export const buildPicBedListMenu = () => {
  const picBeds = getPicBeds()
  const currentPicBed = picgo.getConfig('picBed.uploader')
  const currentPicBedName = picBeds.find(item => item.type === currentPicBed)?.name
  const picBedConfigList = picgo.getConfig<IUploaderConfig>('uploader')
  const currentPicBedMenuItem = [{
    label: `${T('CURRENT_PICBED')} - ${currentPicBedName}`,
    enabled: false
  }, {
    type: 'separator'
  }]
  let submenu = picBeds.filter(item => item.visible).map(item => {
    const configList = picBedConfigList?.[item.type]?.configList
    const defaultId = picBedConfigList?.[item.type]?.defaultId
    const hasSubmenu = !!configList
    return {
      label: item.name,
      type: !hasSubmenu ? 'checkbox' : undefined,
      checked: !hasSubmenu ? (currentPicBed === item.type) : undefined,
      submenu: hasSubmenu
        ? configList.map((config) => {
          return {
            label: config._configName || 'Default',
            // if only one config, use checkbox, or radio will checked as default
            // see: https://github.com/electron/electron/issues/21292
            type: 'checkbox',
            checked: config._id === defaultId && (item.type === currentPicBed),
            click: function () {
              changeCurrentUploader(item.type, config, config._id)
              if (windowManager.has(IWindowList.SETTING_WINDOW)) {
                windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
              }
            }
          }
        })
        : undefined,
      click: !hasSubmenu
        ? function () {
          picgo.saveConfig({
            'picBed.current': item.type,
            'picBed.uploader': item.type
          })
          if (windowManager.has(IWindowList.SETTING_WINDOW)) {
            windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
          }
        }
        : undefined
    }
  })
  // @ts-ignore
  submenu = currentPicBedMenuItem.concat(submenu)
  // @ts-ignore
  return Menu.buildFromTemplate(submenu)
}
