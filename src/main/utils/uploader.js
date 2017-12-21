import weiboUpload from './weiboUpload'
import qiniuUpload from './qiniuUpload'
import tcYunUpload from './tcYunUpload'
import db from '../../datastore/index'
const uploader = (img, type, webContents) => {
  const uploadType = db.read().get('picBed.current').value()
  switch (uploadType) {
    case 'weibo':
      return weiboUpload(img, type, webContents)
    case 'qiniu':
      return qiniuUpload(img, type, webContents)
    case 'tcyun':
      return tcYunUpload(img, type, webContents)
  }
}

export default uploader
