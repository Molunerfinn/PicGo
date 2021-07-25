import db from '~/main/apis/core/datastore'
import { ipcMain } from 'electron'
import { showMessageBox } from '~/main/utils/common'
import { SHOW_PRIVACY_MESSAGE } from '~/universal/events/constants'

class PrivacyManager {
  async init () {
    ipcMain.on(SHOW_PRIVACY_MESSAGE, () => {
      this.show(false)
    })
    if (db.get('settings.privacyEnsure') !== true) {
      const res = await this.show(true)
      // cancel
      if (res.result === 1) {
        return false
      } else {
        db.set('settings.privacyEnsure', true)
        return true
      }
    }
    return true
  }

  async show (showCancel = true) {
    const res = await showMessageBox({
      type: 'info',
      buttons: showCancel ? ['Yes', 'No'] : ['Yes'],
      title: '隐私协议',
      message: `
      本软件尊重并保护所有使用服务用户的个人隐私权。为了给您提供更准确、更优质的服务，本软件会按照本隐私权政策的规定使用和收集您的一些行为信息。您在同意本软件服务使用协议之时，即视为您已经同意本隐私权政策全部内容。本隐私权政策属于本软件服务使用协议不可分割的一部分，如果不同意将无法使用。本协议会定期更新。

      1.适用范围

      a)在您使用本软件时，本软件会记录的您对本软件的一些操作行为信息，包括但不限于您使用本软件进行文件上传的耗时、类型、数量等信息。

      2.信息的使用

      a)在获得您的使用数据之后，本软件会将其上传至数据分析服务器，以便分析数据后，提供给您更好的服务。

      3.信息披露

      a)本软件不会将您的信息披露给不受信任的第三方。

      b)根据法律的有关规定，或者行政或司法机构的要求，向第三方或者行政、司法机构披露；

      c)如您出现违反中国有关法律、法规或者相关规则的情况，需要向第三方披露；

      4.信息安全

      a)本软件不会收集您的个人信息、密钥信息等隐私信息，所收集的信息仅仅作为改善软件、优化体验、了解软件日活等用途。
      `
    })
    return res
  }
}

const privacyManager = new PrivacyManager()

export {
  privacyManager
}
