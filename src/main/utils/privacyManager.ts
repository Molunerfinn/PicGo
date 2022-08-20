import db from '~/main/apis/core/datastore'
import { showMessageBox } from '~/main/utils/common'
import { T } from '~/main/i18n'

class PrivacyManager {
  async check () {
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
      title: T('PRIVACY_AGREEMENT'),
      message: T('PRIVACY')
    })
    return res
  }
}

const privacyManager = new PrivacyManager()

export {
  privacyManager
}
