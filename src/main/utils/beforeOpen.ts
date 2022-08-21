import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { dbPathChecker } from 'apis/core/datastore/dbChecker'
import yaml from 'js-yaml'
import { i18nManager } from '~/main/i18n'
// import { ILocales } from '~/universal/types/i18n'

const configPath = dbPathChecker()
const CONFIG_DIR = path.dirname(configPath)

function beforeOpen () {
  if (process.platform === 'darwin') {
    resolveMacWorkFlow()
  }
  resolveClipboardImageGenerator()
  resolveOtherI18nFiles()
}

/**
 * macOS 右键菜单
 */
function resolveMacWorkFlow () {
  const dest = `${os.homedir()}/Library/Services/Upload pictures with PicGo.workflow`
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

function diffFilesAndUpdate (filePath1: string, filePath2: string) {
  try {
    const file1 = fs.existsSync(filePath1) && fs.readFileSync(filePath1)
    const file2 = fs.existsSync(filePath1) && fs.readFileSync(filePath2)

    if (!file1 || !file2 || !file1.equals(file2)) {
      fs.copyFileSync(filePath1, filePath2)
    }
  } catch (e) {
    console.error(e)
    fs.copyFileSync(filePath1, filePath2)
  }
}

/**
 * 初始化剪贴板生成图片的脚本
 */
function resolveClipboardImageGenerator () {
  const clipboardFiles = getClipboardFiles()
  if (!fs.pathExistsSync(path.join(CONFIG_DIR, 'windows10.ps1'))) {
    clipboardFiles.forEach(item => {
      fs.copyFileSync(item.origin, item.dest)
    })
  } else {
    clipboardFiles.forEach(item => {
      diffFilesAndUpdate(item.origin, item.dest)
    })
  }

  function getClipboardFiles () {
    const files = [
      '/linux.sh',
      '/mac.applescript',
      '/windows.ps1',
      '/windows10.ps1',
      '/wsl.sh'
    ]

    return files.map(item => {
      return {
        origin: path.join(__static, item),
        dest: path.join(CONFIG_DIR, item)
      }
    })
  }
}

/**
 * 初始化其他语言文件
 */
function resolveOtherI18nFiles () {
  const i18nFolder = path.join(CONFIG_DIR, 'i18n')
  if (!fs.pathExistsSync(i18nFolder)) {
    fs.mkdirSync(i18nFolder)
  }
  i18nManager.setOutterI18nFolder(i18nFolder)
  const i18nFiles = fs.readdirSync(path.join(CONFIG_DIR, 'i18n'), {
    withFileTypes: true
  })
  i18nFiles.forEach(item => {
    if (item.isFile() && item.name?.endsWith('.yml')) {
      const i18nFilePath = path.join(i18nFolder, item.name)
      const i18nFile = fs.readFileSync(i18nFilePath, 'utf8')
      try {
        const i18nFileObj = yaml.load(i18nFile) as unknown as ILocales
        if (i18nFileObj?.LANG_DISPLAY_LABEL) {
          i18nManager.addI18nFile(item.name.replace('.yml', ''), i18nFileObj.LANG_DISPLAY_LABEL)
        }
      } catch (e) {
        console.error(e)
      }
    }
  })
}

export default beforeOpen
