import fs from 'fs-extra'
import path from 'path'
import sizeOf from 'image-size'
import fecha from 'fecha'
import { BrowserWindow, ipcMain } from 'electron'
import db from '../../datastore/index.js'
const renameURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080/#rename-page` : `file://${__dirname}/index.html#rename-page`

const createRenameWindow = () => {
  let options = {
    height: 175,
    width: 300,
    show: true,
    fullscreenable: false,
    resizable: false,
    vibrancy: 'ultra-dark',
    webPreferences: {
      backgroundThrottling: false
    }
  }

  if (process.platform !== 'darwin') {
    options.show = true
    options.backgroundColor = '#3f3c37'
    options.autoHideMenuBar = true
    options.transparent = false
  }

  const window = new BrowserWindow(options)
  window.loadURL(renameURL)
  return window
}

const imgFromPath = async (imgPath) => {
  let results = []
  const rename = db.read().get('picBed.rename').value()
  const autoRename = db.read().get('picBed.autoRename').value()
  await Promise.all(imgPath.map(async item => {
    let name
    let fileName
    if (autoRename) {
      fileName = fecha.format(new Date(), 'YYYYMMDDHHmmss') + path.extname(item)
    } else {
      fileName = path.basename(item)
    }
    if (rename) {
      const window = createRenameWindow()
      await waitForShow(window.webContents)
      window.webContents.send('rename', fileName, window.webContents.id)
      name = await waitForRename(window, window.webContents.id)
    }
    let buffer = await fs.readFile(item)
    let base64Image = Buffer.from(buffer, 'binary').toString('base64')
    let imgSize = sizeOf(item)
    results.push({
      base64Image,
      fileName: name || fileName,
      width: imgSize.width,
      height: imgSize.height,
      extname: path.extname(item)
    })
  }))
  return results
}

const imgFromClipboard = async (file) => {
  let result = []
  let rename = db.read().get('picBed.rename').value()
  if (file !== null) {
    let name
    const today = fecha.format(new Date(), 'YYYYMMDDHHmmss') + '.png'
    if (rename) {
      const window = createRenameWindow()
      await waitForShow(window.webContents)
      window.webContents.send('rename', today, window.webContents.id)
      name = await waitForRename(window, window.webContents.id)
    }
    result.push({
      base64Image: file.imgUrl.replace(/^data\S+,/, ''),
      fileName: name || today,
      width: file.width,
      height: file.height,
      extname: '.png'
    })
  }
  return result
}

const imgFromUploader = async (files) => {
  let results = []
  const rename = db.read().get('picBed.rename').value()
  const autoRename = db.read().get('picBed.autoRename').value()
  await Promise.all(files.map(async item => {
    let name
    let fileName
    if (autoRename) {
      fileName = fecha.format(new Date(), 'YYYYMMDDHHmmss') + path.extname(item.name)
    } else {
      fileName = path.basename(item.path)
    }
    if (rename) {
      const window = createRenameWindow()
      await waitForShow(window.webContents)
      window.webContents.send('rename', fileName, window.webContents.id)
      name = await waitForRename(window, window.webContents.id)
    }
    let buffer = await fs.readFile(item.path)
    let base64Image = Buffer.from(buffer, 'binary').toString('base64')
    let imgSize = sizeOf(item.path)
    results.push({
      base64Image,
      fileName: name || fileName,
      width: imgSize.width,
      height: imgSize.height,
      extname: path.extname(item.name)
    })
  }))
  return results
}

const waitForShow = (webcontent) => {
  return new Promise((resolve, reject) => {
    webcontent.on('dom-ready', () => {
      resolve()
    })
  })
}

const waitForRename = (window, id) => {
  return new Promise((resolve, reject) => {
    ipcMain.once(`rename${id}`, (evt, newName) => {
      resolve(newName)
      window.hide()
    })
    window.on('close', () => {
      resolve(null)
      ipcMain.removeAllListeners(`rename${id}`)
    })
  })
}

export {
  imgFromPath,
  imgFromClipboard,
  imgFromUploader
}
