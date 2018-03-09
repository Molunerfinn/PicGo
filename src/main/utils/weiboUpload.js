import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification } from 'electron'
const j = request.jar()
const rp = request.defaults({jar: j})
const UPLOAD_URL = 'http://picupload.service.weibo.com/interface/pic_upload.php?ori=1&mime=image%2Fjpeg&data=base64&url=0&markpos=1&logo=&nick=0&marks=1&app=miniblog'

const postOptions = (formData) => {
  return {
    method: 'POST',
    url: 'https://passport.weibo.cn/sso/login',
    headers: {
      Referer: 'https://passport.weibo.cn/signin/login',
      contentType: 'application/x-www-form-urlencoded'
    },
    formData,
    json: true,
    resolveWithFullResponse: true
  }
}

const weiboUpload = async function (img, type, webContents) {
  try {
    webContents.send('uploadProgress', 0)
    const formData = {
      username: db.read().get('picBed.weibo.username').value(),
      password: db.read().get('picBed.weibo.password').value()
    }
    const quality = db.read().get('picBed.weibo.quality').value()
    const cookie = db.read().get('picBed.weibo.cookie').value()
    const chooseCookie = db.read().get('picBed.weibo.chooseCookie').value()
    const options = postOptions(formData)
    let res
    if (!chooseCookie) {
      res = await rp(options)
    }
    webContents.send('uploadProgress', 30)
    if (chooseCookie || res.body.retcode === 20000000) {
      if (res) {
        for (let i in res.body.data.crossdomainlist) {
          await rp.get(res.body.data.crossdomainlist[i])
        }
      }
      webContents.send('uploadProgress', 60)
      const imgList = await img2Base64[type](img)
      for (let i in imgList) {
        let opt = {
          formData: {
            b64_data: imgList[i].base64Image
          }
        }
        if (chooseCookie) {
          opt.headers = {
            Cookie: cookie
          }
        }
        let result = await rp.post(UPLOAD_URL, opt)
        result = result.replace(/<.*?\/>/, '').replace(/<(\w+).*?>.*?<\/\1>/, '')
        delete imgList[i].base64Image
        const resTextJson = JSON.parse(result)
        if (resTextJson.data.pics.pic_1.pid === undefined) {
          webContents.send('uploadProgress', -1)
          const notification = new Notification({
            title: '上传失败！',
            body: '微博Cookie失效，请在网页版重新登录一遍'
          })
          notification.show()
          return new Error()
        } else {
          const extname = imgList[i].extname === '.gif' ? '.gif' : '.jpg'
          imgList[i]['imgUrl'] = `https://ws1.sinaimg.cn/${quality}/${resTextJson.data.pics.pic_1.pid}${extname}`
          imgList[i]['type'] = 'weibo'
        }
        delete imgList[i].extname
      }
      webContents.send('uploadProgress', 100)
      return imgList
    } else {
      webContents.send('uploadProgress', -1)
      const notification = new Notification({
        title: '上传失败！',
        body: res.body.msg
      })
      notification.show()
      return new Error()
    }
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
