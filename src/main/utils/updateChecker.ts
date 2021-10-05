import { dialog, shell } from 'electron'
import db from '~/main/apis/core/datastore'
import axios from 'axios'
import pkg from 'root/package.json'
import { lt } from 'semver'
const version = pkg.version
const releaseUrl =
  'https://api.github.com/repos/Molunerfinn/PicGo/releases/latest'
const releaseUrlBackup =
  'https://cdn.jsdelivr.net/gh/Molunerfinn/PicGo@latest/package.json'
const downloadUrl = 'https://github.com/Molunerfinn/PicGo/releases/latest'

const checkVersion = async () => {
  let showTip = db.get('settings.showUpdateTip')
  if (showTip === undefined) {
    db.set('settings.showUpdateTip', true)
    showTip = true
  }
  if (showTip) {
    let res: any
    try {
      res = await axios.get(releaseUrl).catch(async () => {
        const result = await axios.get(releaseUrlBackup)
        return result
      })
    } catch (err) {
      console.log(err)
    }
    if (res.status === 200) {
      const latest = res.data.version || res.data.name
      const result = compareVersion2Update(version, latest)
      if (result) {
        dialog
          .showMessageBox({
            type: 'info',
            title: '发现新版本',
            buttons: ['Yes', 'No'],
            message: `发现新版本${latest}，更新了很多功能，是否去下载最新的版本？`,
            checkboxLabel: '以后不再提醒',
            checkboxChecked: false
          })
          .then((res) => {
            if (res.response === 0) {
              // if selected yes
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
