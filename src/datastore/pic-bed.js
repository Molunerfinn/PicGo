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

export default picBed
