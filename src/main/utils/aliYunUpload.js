import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification, clipboard } from 'electron'
import { Wrapper as OSS } from 'ali-oss'

let client

// generate OSS Options
const generateOSSOptions = () => {
  const options = db.read().get('picBed.aliyun').value()
  let obj = {
    region: `${options.area}`,
    accessKeyId: `${options.accessKeyId}`,
    accessKeySecret: `${options.accessKeySecret}`,
    bucket: `${options.bucket}`,
    secure: true
  }
  client = new OSS({
    region: `${options.area}`,
    accessKeyId: `${options.accessKeyId}`,
    accessKeySecret: `${options.accessKeySecret}`,
    bucket: `${options.bucket}`,
    secure: true
  })
  console.log(obj)
  return client
}

const aliYunUpload = async (img, type, webContents) => {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    const aliYunOptions = db.read().get('picBed.aliyun').value()
    const customUrl = aliYunOptions.customUrl
    const path = aliYunOptions.path
    const length = imgList.length
    generateOSSOptions()
    for (let i in imgList) {
      let body = await client.put(`${path}${imgList[i].fileName}`, Buffer.from(imgList[i].base64Image, 'base64'))
      if (body.res.status === 200) {
        delete imgList[i].base64Image
        if (customUrl) {
          imgList[i]['imgUrl'] = `${customUrl}/${path}${imgList[i].fileName}`
        } else {
          imgList[i]['imgUrl'] = body.url
        }
        imgList[i]['type'] = 'aliyun'
        if (i - length === -1) {
          webContents.send('uploadProgress', 60)
        }
      } else {
        webContents.send('uploadProgress', -1)
        const notification = new Notification({
          title: '上传失败！',
          body: '上传失败！'
        })
        notification.show()
        return false
      }
    }
    webContents.send('uploadProgress', 100)
    return imgList
  } catch (err) {
    webContents.send('uploadProgress', -1)
    const notification = new Notification({
      title: '上传失败！',
      body: `请检查你的配置`
    })
    notification.show()
    clipboard.writeText('https://cloud.tencent.com/document/product/436/8432')
    throw new Error(err)
  }
}

export default aliYunUpload
