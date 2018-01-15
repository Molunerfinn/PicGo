import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification } from 'electron'
const UPLOAD_URL = 'http://picupload.service.weibo.com/interface/pic_upload.php?ori=1&mime=image%2Fjpeg&data=base64&url=0&markpos=1&logo=&nick=0&marks=1&app=miniblog'
const weiboUpload = async function (img, type, webContents) {
  try {
    webContents.send('uploadProgress', 0)
    const quality = db.read().get('picBed.weiboCookie.quality').value()
    const cookie = db.read().get('picBed.weiboCookie.cookie').value()
    webContents.send('uploadProgress', 60)
    const imgList = await img2Base64[type](img)
    for (let i in imgList) {
      let result = await request.post(UPLOAD_URL, {
        headers: {
          Cookie: cookie
        },
        formData: {
          b64_data: imgList[i].base64Image
        }
      })
      result = result.replace(/<.*?\/>/, '').replace(/<(\w+).*?>.*?<\/\1>/, '')
      delete imgList[i].base64Image
      const resTextJson = JSON.parse(result)
      imgList[i]['imgUrl'] = `https://ws1.sinaimg.cn/${quality}/${resTextJson.data.pics.pic_1.pid}`
      imgList[i]['type'] = 'weibo'
    }
    webContents.send('uploadProgress', 100)
    return imgList
  } catch (err) {
    webContents.send('uploadProgress', -1)
    const notification = new Notification({
      title: '上传失败！',
      body: '服务端出错，请重试'
    })
    notification.show()
    throw new Error(err)
  }
}

export default weiboUpload
