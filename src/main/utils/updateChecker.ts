import { dialog, shell } from 'electron'
import db from '~/main/apis/core/datastore'
import pkg from 'root/package.json'
import { lt } from 'semver'
import { T } from '~/main/i18n'
import { getLatestVersion } from '~/main/utils/getLatestVersion'
const version = pkg.version
// const releaseUrl = 'https://api.github.com/repos/Molunerfinn/PicGo/releases'
// const releaseUrlBackup = 'https://picgo-1251750343.cos.ap-chengdu.myqcloud.com'
const downloadUrl = 'https://github.com/Molunerfinn/PicGo/releases/latest'

const checkVersion = async () => {
  let showTip = db.get('settings.showUpdateTip')
  if (showTip === undefined) {
    db.set('settings.showUpdateTip', true)
    showTip = true
  }
  if (showTip) {
    const isCheckBetaUpdate = db.get('settings.checkBetaUpdate') !== false
    const res: string = await getLatestVersion(isCheckBetaUpdate)
    if (res !== '') {
      const latest = res
      const result = compareVersion2Update(version, latest)
      if (result) {
        dialog.showMessageBox({
          type: 'info',
          title: T('FIND_NEW_VERSION'),
          buttons: ['Yes', 'No'],
          message: T('TIPS_FIND_NEW_VERSION', {
            v: latest
          }),
          checkboxLabel: T('NO_MORE_NOTICE'),
          checkboxChecked: false
        }).then(res => {
          if (res.response === 0) { // if selected yes
            shell.openExternal(downloadUrl)
          }
          db.set('settings.showUpdateTip', !res.checkboxChecked)
        })
      }
    } else {
      return false
    }
  } else {
    return false
  }
}

// if true -> update else return false
const compareVersion2Update = (current: string, latest: string) => {
  try {
    if (latest.includes('beta')) {
      const isCheckBetaUpdate = db.get('settings.checkBetaUpdate') !== false
      if (!isCheckBetaUpdate) {
        return false
      }
    }
    return lt(current, latest)
  } catch (e) {
    return false
  }
}

export default checkVersion
