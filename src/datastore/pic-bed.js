import weiboUpload from '../main/utils/weiboUpload'
import qiniuUpload from '../main/utils/qiniuUpload'
import tcYunUpload from '../main/utils/tcYunUpload'
import upYunUpload from '../main/utils/upYunUpload'
import githubUpload from '../main/utils/githubUpload'
import db from './index'

let picBed = db.read().get('picBed.list').value()

if (!picBed) {
  picBed = [
    {
      type: 'weibo',
      name: '微博图床',
      visible: true
    },
    {
      type: 'qiniu',
      name: '七牛图床',
      visible: true
    },
    {
      type: 'tcyun',
      name: '腾讯云COS',
      visible: true
    },
    {
      type: 'upyun',
      name: '又拍云图床',
      visible: true
    },
    {
      type: 'github',
      name: 'GitHub图床',
      visible: true
    }
  ]
}

const picBedHandler = {
  weibo: weiboUpload,
  qiniu: qiniuUpload,
  tcyun: tcYunUpload,
  upyun: upYunUpload,
  github: githubUpload
}

export {
  picBed,
  picBedHandler
}
