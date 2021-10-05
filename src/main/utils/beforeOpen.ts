import fs from 'fs-extra'
import path from 'path'
import os from 'os'

function beforeOpen() {
  if (process.platform === 'darwin') {
    resolveMacWorkFlow()
  }
}

/**
 * macOS 右键菜单
 */
function resolveMacWorkFlow() {
  const dest = `${os.homedir}/Library/Services/Upload pictures with PicGo.workflow`
  if (fs.existsSync(dest)) {
    return true
  } else {
    try {
      fs.copySync(
        path.join(__static, 'Upload pictures with PicGo.workflow'),
        dest
      )
    } catch (e) {
      console.log(e)
    }
  }
}

export default beforeOpen
