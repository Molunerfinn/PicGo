import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification } from 'electron'
const j = request.jar()
const rp = request.defaults({jar: j})
const UPLOAD_URL = 'http://picupload.service.weibo.com/interface/pic_upload.php?ori=1&mime=image%2Fjpeg&data=base64&url=0&markpos=1&logo=&nick=0&marks=1&app=miniblog'

function postOptions (formData) {
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

const weiboUpload = async function (img, type) {
  try {
    const formData = {
      username: db.read().get('picBed.weibo.username').value(),
      password: db.read().get('picBed.weibo.password').value()
    }
    const options = postOptions(formData)
    const res = await rp(options)
    if (res.body.retcode === 20000000) {
      for (let i in res.body.data.crossdomainlist) {
        await rp.get(res.body.data.crossdomainlist[i])
      }
      const imgList = await img2Base64[type](img)
      let resText = []
      for (let i in imgList) {
        let result = await rp.post(UPLOAD_URL, {
          formData: {
            b64_data: imgList[i].base64Image
          }
        })
        resText.push(result.replace(/<.*?\/>/, '').replace(/<(\w+).*?>.*?<\/\1>/, ''))
      }
      for (let i in imgList) {
        const resTextJson = JSON.parse(resText[i])
        imgList[i]['imgUrl'] = `https://ws1.sinaimg.cn/large/${resTextJson.data.pics.pic_1.pid}`
        delete imgList[i].base64Image
      }
      return imgList
    } else {
      const notification = new Notification({
        title: '上传失败！',
        body: res.body.msg
      })
      notification.show()
    }
  } catch (err) {
    console.log('This is error', err, err.name === 'RequestError')
    throw new Error(err)
  }
}

export {
  weiboUpload
}
