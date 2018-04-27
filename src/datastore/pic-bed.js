import weiboUpload from '../main/utils/weiboUpload'
import qiniuUpload from '../main/utils/qiniuUpload'
import tcYunUpload from '../main/utils/tcYunUpload'
import upYunUpload from '../main/utils/upYunUpload'
import githubUpload from '../main/utils/githubUpload'

const picBed = [
  {
    type: 'weibo',
    name: '微博图床'
  },
  {
    type: 'qiniu',
    name: '七牛图床'
  },
  {
    type: 'tcyun',
    name: '腾讯云COS'
  },
  {
    type: 'upyun',
    name: '又拍云图床'
  },
  {
    type: 'github',
    name: 'GitHub图床'
  }
]

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
