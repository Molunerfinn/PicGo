import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification, clipboard } from 'electron'
import crypto from 'crypto'
import MD5 from 'md5'

// generate COS signature string
const generateSignature = (fileName) => {
  const options = db.read().get('picBed.upyun').value()
  const path = options.path || ''
  const operator = options.operator
  const password = options.password
  const md5Password = MD5(password)
  const date = new Date().toGMTString()
  const uri = `/${options.bucket}/${path}${encodeURI(fileName)}`
  const value = `PUT&${uri}&${date}`
  const sign = crypto.createHmac('sha1', md5Password).update(value).digest('base64')
  return `UPYUN ${operator}:${sign}`
}

const postOptions = (fileName, signature, imgBase64) => {
  const options = db.read().get('picBed.upyun').value()
  const bucket = options.bucket
  const path = options.path || ''
  return {
    method: 'PUT',
    url: `https://v0.api.upyun.com/${bucket}/${path}${encodeURI(fileName)}`,
    headers: {
      Authorization: signature,
      Date: new Date().toGMTString()
    },
    body: Buffer.from(imgBase64, 'base64'),
    resolveWithFullResponse: true
  }
}

const upYunUpload = async (img, type, webContents) => {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    const length = imgList.length
    const upyunOptions = db.read().get('picBed.upyun').value()
    const path = upyunOptions.path || ''
    for (let i in imgList) {
      const singature = generateSignature(imgList[i].fileName)
      const options = postOptions(imgList[i].fileName, singature, imgList[i].base64Image)
      const body = await request(options)
      if (body.statusCode === 200) {
        delete imgList[i].base64Image
        imgList[i]['imgUrl'] = `${upyunOptions.url}/${path}${imgList[i].fileName}${upyunOptions.options}`
        imgList[i]['type'] = 'upyun'
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
    console.log(err)
    const body = JSON.parse(err.error)
    webContents.send('uploadProgress', -1)
    const notification = new Notification({
      title: '上传失败！',
      body: `错误码：${body.code}，请打开浏览器粘贴地址查看相关原因。`
    })
    notification.show()
    clipboard.writeText('http://docs.upyun.com/api/errno/')
    // throw new Error(err)
  }
}

export default upYunUpload
