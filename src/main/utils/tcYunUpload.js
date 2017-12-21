import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification, clipboard } from 'electron'
import crypto from 'crypto'

// generate COS signature string
const generateSignature = () => {
  const options = db.read().get('picBed.tcyun').value()
  const secretId = options.secretId
  const secretKey = options.secretKey
  const appId = options.appId
  const bucket = options.bucket
  const random = Math.floor(Math.random() * 10000000000)
  const current = parseInt(new Date().getTime() / 1000) - 1
  const expired = current + 3600

  const multiSignature = `a=${appId}&b=${bucket}&k=${secretId}&e=${expired}&t=${current}&r=${random}&f=`

  const signHexKey = crypto.createHmac('sha1', secretKey).update(multiSignature).digest()
  const tempString = Buffer.concat([signHexKey, Buffer.from(multiSignature)])
  const signature = Buffer.from(tempString).toString('base64')
  return {
    signature,
    appId,
    bucket
  }
}

const postOptions = (fileName, signature, imgBase64) => {
  const area = db.read().get('picBed.tcyun.area').value()
  const path = db.read().get('picBed.tcyun.path').value()
  return {
    method: 'POST',
    url: `http://${area}.file.myqcloud.com/files/v2/${signature.appId}/${signature.bucket}/${path}${fileName}`,
    headers: {
      Host: `${area}.file.myqcloud.com`,
      Authorization: signature.signature,
      contentType: 'multipart/form-data'
    },
    formData: {
      op: 'upload',
      filecontent: Buffer.from(imgBase64, 'base64')
    }
  }
}

const tcYunUpload = async (img, type, webContents) => {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    const singature = generateSignature()
    const length = imgList.length
    for (let i in imgList) {
      const options = postOptions(imgList[i].fileName, singature, imgList[i].base64Image)
      const res = await request(options)
      const body = JSON.parse(res)
      if (body.message === 'SUCCESS') {
        delete imgList[i].base64Image
        imgList[i]['imgUrl'] = body.data.source_url
        imgList[i]['type'] = 'tcyun'
        if (i - length === -1) {
          webContents.send('uploadProgress', 60)
        }
      } else {
        webContents.send('uploadProgress', -1)
        const notification = new Notification({
          title: '上传失败！',
          body: res.body.msg
        })
        notification.show()
      }
    }
    webContents.send('uploadProgress', 100)
    return imgList
  } catch (err) {
    const body = JSON.parse(err.error)
    webContents.send('uploadProgress', -1)
    const notification = new Notification({
      title: '上传失败！',
      body: `错误码：${body.code}，请打开浏览器粘贴地址查看相关原因。`
    })
    notification.show()
    clipboard.writeText('https://cloud.tencent.com/document/product/436/8432')
    throw new Error(err)
  }
}

export default tcYunUpload
