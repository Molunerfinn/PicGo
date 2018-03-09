import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import * as qiniu from 'qiniu'
import { Notification } from 'electron'

function postOptions (fileName, token, imgBase64) {
  const area = selectArea(db.read().get('picBed.qiniu.area').value() || 'z0')
  const path = db.read().get('picBed.qiniu.path') || ''
  const base64FileName = Buffer.from(path + fileName, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
  return {
    method: 'POST',
    url: `http://upload${area}.qiniu.com/putb64/-1/key/${base64FileName}`,
    headers: {
      Authorization: `UpToken ${token}`,
      contentType: 'application/octet-stream'
    },
    body: imgBase64
  }
}

function selectArea (area) {
  return area === 'z0' ? '' : '-' + area
}

function getToken () {
  const accessKey = db.read().get('picBed.qiniu.accessKey').value()
  const secretKey = db.read().get('picBed.qiniu.secretKey').value()
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  const options = {
    scope: db.read().get('picBed.qiniu.bucket').value()
  }
  const putPolicy = new qiniu.rs.PutPolicy(options)
  return putPolicy.uploadToken(mac)
}

const qiniuUpload = async function (img, type, webContents) {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    webContents.send('uploadProgress', 30)
    const length = imgList.length
    for (let i in imgList) {
      const options = postOptions(imgList[i].fileName, getToken(), imgList[i].base64Image)
      const res = await request(options)
      const body = JSON.parse(res)
      if (body.key) {
        delete imgList[i].base64Image
        const baseUrl = db.get('picBed.qiniu.url').value()
        const options = db.get('picBed.qiniu.options').value()
        imgList[i]['imgUrl'] = `${baseUrl}/${body.key}${options}`
        imgList[i]['type'] = 'qiniu'
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
    webContents.send('uploadProgress', -1)
    const error = JSON.parse(err.response.body)
    const notification = new Notification({
      title: '上传失败！',
      body: error.error
    })
    notification.show()
    throw new Error(err)
  }
}

export default qiniuUpload
