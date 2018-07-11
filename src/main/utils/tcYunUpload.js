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
  let signTime
  if (!options.version || options.version === 'v4') {
    const random = Math.floor(Math.random() * 10000000000)
    const current = parseInt(new Date().getTime() / 1000) - 1
    const expired = current + 3600

    const multiSignature = `a=${appId}&b=${bucket}&k=${secretId}&e=${expired}&t=${current}&r=${random}&f=`

    const signHexKey = crypto.createHmac('sha1', secretKey).update(multiSignature).digest()
    const tempString = Buffer.concat([signHexKey, Buffer.from(multiSignature)])
    signature = Buffer.from(tempString).toString('base64')
  } else {
    // https://cloud.tencent.com/document/product/436/7778#signature
    const today = Math.floor(new Date().getTime() / 1000)
    const tomorrow = today + 86400
    signTime = `${today};${tomorrow}`
    const signKey = crypto.createHmac('sha1', secretKey).update(signTime).digest('hex')
    const httpString = `put\n/${options.path}${fileName}\n\nhost=${options.bucket}.cos.${options.area}.myqcloud.com\n`
    const sha1edHttpString = crypto.createHash('sha1').update(httpString).digest('hex')
    const stringToSign = `sha1\n${signTime}\n${sha1edHttpString}\n`
    signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
  }
  return {
    signature,
    appId,
    bucket,
    signTime
  }
}

const postOptions = (fileName, signature, imgBase64) => {
  const options = db.read().get('picBed.tcyun').value()
  const area = options.area
  const path = options.path
  if (!options.version || options.version === 'v4') {
    return {
      method: 'POST',
      url: `http://${area}.file.myqcloud.com/files/v2/${signature.appId}/${signature.bucket}/${encodeURI(path)}${fileName}`,
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
      url: `http://${options.bucket}.cos.${options.area}.myqcloud.com/${encodeURI(path)}${encodeURI(fileName)}`,
      headers: {
        Host: `${options.bucket}.cos.${options.area}.myqcloud.com`,
        Authorization: `q-sign-algorithm=sha1&q-ak=${options.secretId}&q-sign-time=${signature.signTime}&q-key-time=${signature.signTime}&q-header-list=host&q-url-param-list=&q-signature=${signature.signature}`,
        contentType: 'multipart/form-data'
      },
      body: Buffer.from(imgBase64, 'base64'),
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
    const useV4 = !tcYunOptions.version || tcYunOptions.version === 'v4'
    for (let i in imgList) {
      const signature = generateSignature(imgList[i].fileName)
      const options = postOptions(imgList[i].fileName, signature, imgList[i].base64Image)
      const res = await request(options)
        .then(res => res)
        .catch(err => {
          console.log(err.response.body)
          return {
            statusCode: 400,
            body: {
              msg: '认证失败！'
            }
          }
        })
      let body
      if (useV4) {
        body = JSON.parse(res)
      } else {
        body = res
      }
      if (useV4 && body.message === 'SUCCESS') {
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
      } else if (!useV4 && body && body.statusCode === 200) {
        delete imgList[i].base64Image
        if (customUrl) {
          imgList[i]['imgUrl'] = `${customUrl}/${path}${imgList[i].fileName}`
        } else {
          imgList[i]['imgUrl'] = `https://${tcYunOptions.bucket}.cos.${tcYunOptions.area}.myqcloud.com/${path}${imgList[i].fileName}`
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
        return false
      }
    }
    webContents.send('uploadProgress', 100)
    return imgList
  } catch (err) {
    const options = db.read().get('picBed.tcyun').value()
    let body
    if (!options.version || options.version === 'v4') {
      body = JSON.parse(err.error)
      const notification = new Notification({
        title: '上传失败！',
        body: `错误码：${body.code}，请打开浏览器粘贴地址查看相关原因。`
      })
      notification.show()
      clipboard.writeText('https://cloud.tencent.com/document/product/436/8432')
    } else {
      const notification = new Notification({
        title: '上传失败！',
        body: `请检查你的配置项是否正确`
      })
      notification.show()
    }
    webContents.send('uploadProgress', -1)
    throw new Error(err)
  }
}

export default tcYunUpload
