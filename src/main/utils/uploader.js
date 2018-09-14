// import db from '../../datastore/index'
import { app, Notification } from 'electron'
// import picBeds from '../../datastore/pic-bed-handler'
import PicGo from 'picgo'
import path from 'path'
import fecha from 'fecha'

const STORE_PATH = app.getPath('userData')
const CONFIG_PATH = path.join(STORE_PATH, '/data.json')

// const checkUploader = (type) => {
//   const currentUploader = db.read().get(`picBed.${type}`).value()
//   if (currentUploader) {
//     return true
//   } else {
//     return false
//   }
// }

const uploader = (img, type, webContents) => {
  const picgo = new PicGo(CONFIG_PATH)
  let input = []
  switch (type) {
    case 'imgFromPath':
      input = img
      break
    case 'imgFromClipboard':
      if (img !== null) {
        const today = fecha.format(new Date(), 'YYYYMMDDHHmmss') + '.png'
        input = [
          {
            base64Image: img.imgUrl.replace(/^data\S+,/, ''),
            fileName: name || today,
            width: img.width,
            height: img.height,
            extname: '.png'
          }
        ]
      }
      break
    default:
      input = img.map(item => item.path)
      break
  }
  picgo.upload(input)
  // if (db.read().get('picBed.uploadNotification').value()) {
  //   const notification = new Notification({
  //     title: '上传进度',
  //     body: '正在上传'
  //   })
  //   notification.show()
  // }
  // const uploadType = db.read().get('picBed.current').value()
  // // if (checkUploader(uploadType)) {
  // try {
  //   return picBeds[uploadType](img, type, webContents)
  // } catch (e) {
  //   console.log(e)
  //   return false
  // }
  // } else {
  //   return false
  // }

  picgo.on('notification', message => {
    const notification = new Notification(message)
    notification.show()
  })

  picgo.on('uploadProgress', progress => {
    webContents.send('uploadProgress', progress)
  })

  return new Promise((resolve) => {
    picgo.on('finished', ctx => {
      if (ctx.output.every(item => item.imgUrl)) {
        resolve(ctx.output)
      } else {
        resolve(false)
      }
    })
  })
}

export default uploader
