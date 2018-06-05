import db from '../../datastore/index'
import { Notification } from 'electron'
import picBeds from '../../datastore/pic-bed-handler'

const checkUploader = (type) => {
  const currentUploader = db.read().get(`picBed.${type}`).value()
  if (currentUploader) {
    return true
  } else {
    return false
  }
}

const uploader = (img, type, webContents) => {
  const notification = new Notification({
    title: '上传进度',
    body: '正在上传'
  })
  notification.show()
  const uploadType = db.read().get('picBed.current').value()
  if (checkUploader(uploadType)) {
    return picBeds[uploadType](img, type, webContents)
  } else {
    return false
  }
}

export default uploader
