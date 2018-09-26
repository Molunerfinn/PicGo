import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification } from 'electron'
import crypto from 'crypto'
import mime from 'mime-types'

// generate OSS signature
const generateSignature = (fileName) => {
  const options = db.read().get('picBed.aliyun').value()
  const date = new Date().toGMTString()
  const signString = `PUT\n\n${mime.lookup(fileName)}\n${date}\n/${options.bucket}/${options.path}${fileName}`

  const signature = crypto.createHmac('sha1', options.accessKeySecret).update(signString).digest('base64')
  return `OSS ${options.accessKeyId}:${signature}`
}

const postOptions = (fileName, signature, imgBase64) => {
  const options = db.read().get('picBed.aliyun').value()
  return {
    method: 'PUT',
    url: `https://${options.bucket}.${options.area}.aliyuncs.com/${encodeURI(options.path)}${encodeURI(fileName)}`,
    headers: {
      Host: `${options.bucket}.${options.area}.aliyuncs.com`,
      Authorization: signature,
      Date: new Date().toGMTString(),
      'content-type': mime.lookup(fileName)
    },
    body: Buffer.from(imgBase64, 'base64'),
    resolveWithFullResponse: true
  }
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
    for (let i in imgList) {
      const signature = generateSignature(imgList[i].fileName)
      const options = postOptions(imgList[i].fileName, signature, imgList[i].base64Image)
      let body = await request(options)
      if (body.statusCode === 200) {
        delete imgList[i].base64Image
        if (customUrl) {
          imgList[i]['imgUrl'] = `${customUrl}/${path}${imgList[i].fileName}`
        } else {
          imgList[i]['imgUrl'] = `https://${aliYunOptions.bucket}.${aliYunOptions.area}.aliyuncs.com/${path}${imgList[i].fileName}`
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
      body: `请检查你的配置项是否正确`
    })
    notification.show()
    throw new Error(err)
  }
}

export default aliYunUpload
