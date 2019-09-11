import db from './index'

let picBed = [
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
  },
  {
    type: 'smms',
    name: 'SM.MS图床',
    visible: true
  },
  {
    type: 'aliyun',
    name: '阿里云OSS',
    visible: true
  },
  {
    type: 'imgur',
    name: 'Imgur图床',
    visible: true
  }
]

let picBedFromDB = db.get('picBed.list') || []
let oldLength = picBedFromDB.length
let newLength = picBed.length

if (oldLength !== newLength) {
  for (let i = oldLength; i < newLength; i++) {
    picBedFromDB.push(picBed[i])
  }
}

export default picBedFromDB
