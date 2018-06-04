import request from 'request-promise'
import * as img2Base64 from './img2base64'
import { Notification } from 'electron'

const postOptions = (fileName, imgBase64) => {
  return {
    method: 'POST',
    url: `https://sm.ms/api/upload`,
    formData: {
      smfile: Buffer.from(imgBase64, 'base64'),
      filename: fileName,
      ssl: true
    },
    json: true
  }
}

const smmsUpload = async function (img, type, webContents) {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    for (let i in imgList) {
      const postConfig = postOptions(imgList[i].fileName, imgList[i].base64Image)
      const body = await request(postConfig)
      if (body) {
        delete imgList[i].base64Image
        imgList[i]['imgUrl'] = body.data.url
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
      body: '服务端出错，请重试'
    })
    notification.show()
    throw new Error(err)
  }
}

export default smmsUpload
