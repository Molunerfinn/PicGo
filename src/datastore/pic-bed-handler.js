import weiboUpload from '../main/utils/weiboUpload'
import qiniuUpload from '../main/utils/qiniuUpload'
import tcYunUpload from '../main/utils/tcYunUpload'
import upYunUpload from '../main/utils/upYunUpload'
import githubUpload from '../main/utils/githubUpload'
import smmsUpload from '../main/utils/smmsUpload'

const picBedHandler = {
  weibo: weiboUpload,
  qiniu: qiniuUpload,
  tcyun: tcYunUpload,
  upyun: upYunUpload,
  github: githubUpload,
  smms: smmsUpload
}

export default picBedHandler
