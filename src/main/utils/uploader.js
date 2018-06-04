import weiboUpload from './weiboUpload'
import qiniuUpload from './qiniuUpload'
import tcYunUpload from './tcYunUpload'
import upYunUpload from './upYunUpload'
import githubUpload from './githubUpload'
import smmsUpload from './smmsUpload'
import db from '../../datastore/index'
import { Notification } from 'electron'

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
    switch (uploadType) {
      case 'weibo':
        return weiboUpload(img, type, webContents)
      case 'qiniu':
        return qiniuUpload(img, type, webContents)
      case 'tcyun':
        return tcYunUpload(img, type, webContents)
      case 'upyun':
        return upYunUpload(img, type, webContents)
      case 'github':
        return githubUpload(img, type, webContents)
      case 'smms':
        return smmsUpload(img, type, webContents)
    }
  } else {
    return false
  }
}

export default uploader
