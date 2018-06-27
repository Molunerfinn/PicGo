import weiboUpload from '../main/utils/weiboUpload'
import qiniuUpload from '../main/utils/qiniuUpload'
import tcYunUpload from '../main/utils/tcYunUpload'
import upYunUpload from '../main/utils/upYunUpload'
import githubUpload from '../main/utils/githubUpload'
import smmsUpload from '../main/utils/smmsUpload'
import aliYunUpload from '../main/utils/aliYunUpload'
import imgurUpload from '../main/utils/imgurUpload'

const picBedHandler = {
  weibo: weiboUpload,
  qiniu: qiniuUpload,
  tcyun: tcYunUpload,
  upyun: upYunUpload,
  github: githubUpload,
  smms: smmsUpload,
  aliyun: aliYunUpload,
  imgur: imgurUpload
}

export default picBedHandler
