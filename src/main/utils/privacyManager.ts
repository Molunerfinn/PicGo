import picgo from '@core/picgo'
import { showMessageBox } from '~/main/utils/common'
import { T } from '~/main/i18n'

class PrivacyManager {
  async check () {
    if (picgo.getConfig<string | boolean>('settings.privacyEnsure') !== '20260127') {
      const res = await this.show(true)
      // cancel
      if (res.result === 1) {
        return false
      } else {
        picgo.saveConfig({ 'settings.privacyEnsure': '20260127' })
        return true
      }
    }
    return true
  }

  async show (showCancel = true) {
    const privacyUrl = 'https://picgo.app/privacy/'
    const termsUrl = 'https://picgo.app/terms/'
    const res = await showMessageBox({
      type: 'info',
      buttons: showCancel ? ['Yes', 'No'] : ['Yes'],
      title: T('PRIVACY_TERMS_AGREEMENT'),
      message: T('PRIVACY', {
        privacyUrl,
        termsUrl
      })
    })
    return res
  }
}

const privacyManager = new PrivacyManager()

export {
  privacyManager
}
