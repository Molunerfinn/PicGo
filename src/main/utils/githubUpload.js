import request from 'request-promise'
import * as img2Base64 from './img2base64'
import db from '../../datastore/index'
import { Notification } from 'electron'

const postOptions = (fileName, options, data) => {
  const path = options.path || ''
  const {token, repo} = options
  return {
    method: 'PUT',
    url: `https://api.github.com/repos/${repo}/contents/${path}${encodeURI(fileName)}`,
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'PicGo'
    },
    body: data,
    json: true
  }
}

const githubUpload = async function (img, type, webContents) {
  try {
    webContents.send('uploadProgress', 0)
    const imgList = await img2Base64[type](img)
    const length = imgList.length
    const githubOptions = db.read().get('picBed.github').value()
    webContents.send('uploadProgress', 30)
    for (let i in imgList) {
      const data = {
        message: 'Upload by PicGo',
        branch: githubOptions.branch,
        content: imgList[i].base64Image,
        path: githubOptions.path + encodeURI(imgList[i].fileName)
      }
      const postConfig = postOptions(imgList[i].fileName, githubOptions, data)
      const body = await request(postConfig)
      if (body) {
        delete imgList[i].base64Image
        imgList[i]['imgUrl'] = body.content.download_url
        imgList[i]['type'] = 'github'
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
    webContents.send('uploadProgress', -1)
    const notification = new Notification({
      title: '上传失败！',
      body: '服务端出错，请重试'
    })
    notification.show()
    throw new Error(err)
  }
}

export default githubUpload
