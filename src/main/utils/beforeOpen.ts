import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { remote, app } from 'electron'

const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')

function beforeOpen () {
  if (process.platform === 'darwin') {
    resolveMacWorkFlow()
  }
  resolveClipboardImageGenerator()
}

/**
 * macOS 右键菜单
 */
function resolveMacWorkFlow () {
  const dest = `${os.homedir}/Library/Services/Upload pictures with PicGo.workflow`
  if (fs.existsSync(dest)) {
    return true
  } else {
    try {
      fs.copySync(path.join(__static, 'Upload pictures with PicGo.workflow'), dest)
    } catch (e) {
      console.log(e)
    }
  }
}

/**
 * 初始化剪贴板生成图片的脚本
 */
function resolveClipboardImageGenerator () {
  let clipboardFiles = getClipboardFiles()
  if (!fs.pathExistsSync(path.join(STORE_PATH, 'windows10.ps1'))) {
    clipboardFiles.forEach(item => {
      fs.copyFileSync(item.origin, item.dest)
    })
  } else {
    clipboardFiles.forEach(item => {
      diffFilesAndUpdate(item.origin, item.dest)
    })
  }

  function diffFilesAndUpdate (filePath1: string, filePath2: string) {
    let file1 = fs.readFileSync(filePath1)
    let file2 = fs.readFileSync(filePath2)

    if (!file1.equals(file2)) {
      fs.copyFileSync(filePath1, filePath2)
    }
  }

  function getClipboardFiles () {
    let files = [
      '/linux.sh',
      '/mac.applescript',
      '/windows.ps1',
      '/windows10.ps1'
    ]

    return files.map(item => {
      return {
        origin: path.join(__static, item),
        dest: path.join(STORE_PATH, item)
      }
    })
  }
}

export default beforeOpen
