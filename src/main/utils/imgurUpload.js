import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification, clipboard } from 'electron'

const postOptions = (fileName, imgBase64) => {
  const options = db.read().get('picBed.imgur').value()
  const clientId = options.clientId
  let obj = {
    method: 'POST',
    url: `https://api.imgur.com/3/image`,
    headers: {
      Authorization: 'Client-ID ' + clientId,
      'content-type': 'multipart/form-data',
      'User-Agent': 'PicGo'
    },
    formData: {
      image: imgBase64,
      type: 'base64',
      name: fileName
    }
  }
  if (options.proxy) {
    obj.proxy = options.proxy
  }
  return obj
}

const imgurUpload = async (img, type, webContents) => {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    const length = imgList.length
    for (let i in imgList) {
      const options = postOptions(imgList[i].fileName, imgList[i].base64Image)
      let body = await request(options)
      body = JSON.parse(body)
      if (body.success) {
        delete imgList[i].base64Image
        imgList[i]['imgUrl'] = `${body.data.link}`
        imgList[i]['type'] = 'imgur'
        if (i - length === -1) {
          webContents.send('uploadProgress', 60)
        }
      } else {
        webContents.send('uploadProgress', -1)
        return new Error()
      }
    }
    webContents.send('uploadProgress', 100)
    return imgList
  } catch (err) {
    webContents.send('uploadProgress', -1)
    const notification = new Notification({
      title: '上传失败！',
      body: `请检查你的配置以及网络！`
    })
    notification.show()
    clipboard.writeText('http://docs.imgur.com/api/errno/')
    throw new Error(err)
  }
}

export default imgurUpload
