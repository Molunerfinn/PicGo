import weiboUpload from './weiboUpload'
import qiniuUpload from './qiniuUpload'
import tcYunUpload from './tcYunUpload'
import upYunUpload from './upYunUpload'
import db from '../../datastore/index'

const checkUploader = (type) => {
  const currentUploader = db.read().get(`picBed.${type}`).value()
  if (currentUploader) {
    return true
  } else {
    return false
  }
}

const uploader = (img, type, webContents) => {
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
    }
  } else {
    return false
  }
}

export default uploader
