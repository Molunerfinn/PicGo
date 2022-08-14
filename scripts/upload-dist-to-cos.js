// upload dist bundled-app to cos
require('dotenv').config()
const crypto = require('crypto')
const fs = require('fs')
const mime = require('mime-types')
const pkg = require('../package.json')
const configList = require('./config')
const axios = require('axios').default
const path = require('path')
const distPath = path.join(__dirname, '../dist_electron')

const BUCKET = 'picgo-1251750343'
// const AREA = 'ap-chengdu'
const VERSION = pkg.version
const FILE_PATH = `${VERSION}/`
const SECRET_ID = process.env.PICGO_ENV_COS_SECRET_ID
const SECRET_KEY = process.env.PICGO_ENV_COS_SECRET_KEY

// https://cloud.tencent.com/document/product/436/7778#signature
/**
 * @param {string} fileName
 * @returns
 */
const generateSignature = (fileName, folder = FILE_PATH) => {
  const secretKey = SECRET_KEY
  // const area = AREA
  const bucket = BUCKET
  const path = folder
  const today = Math.floor(new Date().getTime() / 1000)
  const tomorrow = today + 86400
  const signTime = `${today};${tomorrow}`
  const signKey = crypto.createHmac('sha1', secretKey).update(signTime).digest('hex')
  const httpString = `put\n/${path}${fileName}\n\nhost=${bucket}.cos.accelerate.myqcloud.com\n`
  const sha1edHttpString = crypto.createHash('sha1').update(httpString).digest('hex')
  const stringToSign = `sha1\n${signTime}\n${sha1edHttpString}\n`
  const signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
  return {
    signature,
    signTime
  }
}

/**
 *
 * @param {string} fileName
 * @param {Buffer} fileBuffer
 * @param {{ signature: string, signTime: string }} signature
 * @returns
 */
const getReqOptions = (fileName, fileBuffer, signature, folder = FILE_PATH) => {
  return {
    method: 'PUT',
    url: `http://${BUCKET}.cos.accelerate.myqcloud.com/${encodeURI(folder)}${encodeURI(fileName)}`,
    headers: {
      Host: `${BUCKET}.cos.accelerate.myqcloud.com`,
      Authorization: `q-sign-algorithm=sha1&q-ak=${SECRET_ID}&q-sign-time=${signature.signTime}&q-key-time=${signature.signTime}&q-header-list=host&q-url-param-list=&q-signature=${signature.signature}`,
      contentType: mime.lookup(fileName),
      useAgent: `PicGo;${pkg.version};null;null`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    data: fileBuffer,
    resolveWithFullResponse: true
  }
}

const uploadFile = async () => {
  try {
    const platform = process.platform
    if (configList[platform]) {
      let versionFileHasUploaded = false
      for (const [index, config] of configList[platform].entries()) {
        const fileName = `${config.appNameWithPrefix}${VERSION}${config.arch}${config.ext}`
        const filePath = path.join(distPath, fileName)
        const versionFilePath = path.join(distPath, config['version-file'])
        let versionFileName = config['version-file']
        if (VERSION.toLocaleLowerCase().includes('beta')) {
          versionFileName = versionFileName.replace('.yml', '.beta.yml')
        }
        // upload dist file
        const signature = generateSignature(fileName)
        const reqOptions = getReqOptions(fileName, fs.readFileSync(filePath), signature)
        console.log('[PicGo Dist] Uploading...', fileName, `${index + 1}/${configList[platform].length}`)
        await axios.request(reqOptions)

        // upload version file
        if (!versionFileHasUploaded) {
          const signature = generateSignature(versionFileName, '')
          const reqOptions = getReqOptions(versionFileName, fs.readFileSync(versionFilePath), signature, '')
          console.log('[PicGo Version File] Uploading...', versionFileName)
          await axios.request(reqOptions)
          versionFileHasUploaded = true
        }
      }
    } else {
      console.warn('platform not supported!', platform)
    }
  } catch (e) {
    console.error(e)
  }
}

uploadFile()
