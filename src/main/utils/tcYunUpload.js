import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification, clipboard } from 'electron'
import crypto from 'crypto'

// generate COS signature string
const generateSignature = (fileName) => {
  const options = db.read().get('picBed.tcyun').value()
  const secretId = options.secretId
  const secretKey = options.secretKey
  const appId = options.appId
  const bucket = options.bucket
  let signature
  if (!options.version || options.version === 'v4') {
    const random = Math.floor(Math.random() * 10000000000)
    const current = parseInt(new Date().getTime() / 1000) - 1
    const expired = current + 3600

    const multiSignature = `a=${appId}&b=${bucket}&k=${secretId}&e=${expired}&t=${current}&r=${random}&f=`

    const signHexKey = crypto.createHmac('sha1', secretKey).update(multiSignature).digest()
    const tempString = Buffer.concat([signHexKey, Buffer.from(multiSignature)])
    signature = Buffer.from(tempString).toString('base64')
  } else {
    const today = Math.floor(new Date().getTime() / 1000)
    const tomorrow = today + 86400
    const signTime = `${today};${tomorrow}`
    const signKey = crypto.createHmac('sha1', secretKey).update(signTime).digest('hex')
    const httpString = `put\n/${options.path}${fileName}\n\nhost=${options.bucket}.cos.${options.area}.myqcloud.com\n`
    const sha1edHttpString = crypto.createHash('sha1').update(httpString).digest('hex')
    const stringToSign = `sha1\n${signTime}\n${sha1edHttpString}\n`
    signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
  }
  return {
    signature,
    appId,
    bucket
  }
}

const postOptions = (fileName, signature, imgBase64) => {
  const options = db.read().get('picBed.tcyun').value()
  const area = options.area
  const path = options.path
  console.log(options.verison)
  if (!options.version || options.version === 'v4') {
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
  } else {
    return {
      method: 'PUT',
      url: `http://${options.bucket}.cos.${options.area}.myqcloud.com/${path}${fileName}`,
      headers: {
        Host: `${options.bucket}.cos.${options.area}.myqcloud.com`,
        Authorization: signature.signature,
        contentType: 'multipart/form-data'
      },
      formData: {
        op: 'upload',
        filecontent: Buffer.from(imgBase64, 'base64')
      },
      resolveWithFullResponse: true
    }
  }
}

const tcYunUpload = async (img, type, webContents) => {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    const length = imgList.length
    const tcYunOptions = db.read().get('picBed.tcyun').value()
    const customUrl = tcYunOptions.customUrl
    const path = tcYunOptions.path
    for (let i in imgList) {
      const singature = generateSignature(imgList[i].fileName)
      const options = postOptions(imgList[i].fileName, singature, imgList[i].base64Image)
      console.log(123, options)
      const res = await request(options)
      // const body = JSON.parse(res)
      const body = `${res}`
      console.log(body)
      if (body.message === 'SUCCESS') {
        delete imgList[i].base64Image
        if (customUrl) {
          imgList[i]['imgUrl'] = `${customUrl}/${path}${imgList[i].fileName}`
        } else {
          imgList[i]['imgUrl'] = body.data.source_url
        }
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
