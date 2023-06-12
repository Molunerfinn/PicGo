// upload dist bundled-app to r2
// upload version file to cos

require('dotenv').config()
// const crypto = require('crypto')
// const axios = require('axios').default
const fs = require('fs')
const pkg = require('../package.json')
const configList = require('./config')
const mime = require('mime-types')
const path = require('path')
const distPath = path.join(__dirname, '../dist_electron')
const S3Client = require('@aws-sdk/client-s3').S3Client
const Upload = require('@aws-sdk/lib-storage').Upload
// const BUCKET = 'picgo-1251750343'
// const COS_SECRET_ID = process.env.PICGO_ENV_COS_SECRET_ID
// const COS_SECRET_KEY = process.env.PICGO_ENV_COS_SECRET_KEY

const S3_BUCKET = 'picgo'
// const AREA = 'ap-chengdu'
const VERSION = pkg.version
const FILE_PATH = `${VERSION}/`
const S3_SECRET_ID = process.env.PICGO_ENV_S3_SECRET_ID
const S3_SECRET_KEY = process.env.PICGO_ENV_S3_SECRET_KEY
const S3_ACCOUNT_ID = process.env.PICGO_ENV_S3_ACCOUNT_ID

const S3Options = {
  credentials: {
    accessKeyId: S3_SECRET_ID,
    secretAccessKey: S3_SECRET_KEY
  },
  endpoint: `https://${S3_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  sslEnabled: true,
  region: 'auto'
}

// https://cloud.tencent.com/document/product/436/7778#signature
// /**
//  * @param {string} fileName
//  * @returns
//  */
// const generateSignature = (fileName, folder = FILE_PATH) => {
//   const secretKey = COS_SECRET_ID
//   // const area = AREA
//   const bucket = BUCKET
//   const path = folder
//   const today = Math.floor(new Date().getTime() / 1000)
//   const tomorrow = today + 86400
//   const signTime = `${today};${tomorrow}`
//   const signKey = crypto.createHmac('sha1', secretKey).update(signTime).digest('hex')
//   const httpString = `put\n/${path}${fileName}\n\nhost=${bucket}.cos.accelerate.myqcloud.com\n`
//   const sha1edHttpString = crypto.createHash('sha1').update(httpString).digest('hex')
//   const stringToSign = `sha1\n${signTime}\n${sha1edHttpString}\n`
//   const signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
//   return {
//     signature,
//     signTime
//   }
// }

// /**
//  *
//  * @param {string} fileName
//  * @param {Buffer} fileBuffer
//  * @param {{ signature: string, signTime: string }} signature
//  * @returns
//  */
// const getReqOptions = (fileName, fileBuffer, signature, folder = FILE_PATH) => {
//   return {
//     method: 'PUT',
//     url: `http://${BUCKET}.cos.accelerate.myqcloud.com/${encodeURI(folder)}${encodeURI(fileName)}`,
//     headers: {
//       Host: `${BUCKET}.cos.accelerate.myqcloud.com`,
//       Authorization: `q-sign-algorithm=sha1&q-ak=${COS_SECRET_KEY}&q-sign-time=${signature.signTime}&q-key-time=${signature.signTime}&q-header-list=host&q-url-param-list=&q-signature=${signature.signature}`,
//       contentType: mime.lookup(fileName),
//       useAgent: `PicGo;${pkg.version};null;null`
//     },
//     maxContentLength: Infinity,
//     maxBodyLength: Infinity,
//     data: fileBuffer,
//     resolveWithFullResponse: true
//   }
// }

/**
 * a backup for version file
 */
// const uploadVersionFile = async () => {
//   try {
//     const platform = process.platform
//     if (configList[platform]) {
//       let versionFileHasUploaded = false
//       for (const [, config] of configList[platform].entries()) {
//         const versionFilePath = path.join(distPath, config['version-file'])
//         let versionFileName = config['version-file']
//         if (VERSION.toLocaleLowerCase().includes('beta')) {
//           versionFileName = versionFileName.replace('.yml', '.beta.yml')
//         }
//         // upload version file
//         if (!versionFileHasUploaded) {
//           const signature = generateSignature(versionFileName, '')
//           const reqOptions = getReqOptions(versionFileName, fs.readFileSync(versionFilePath), signature, '')
//           console.log('[PicGo Version File] Uploading...', versionFileName)
//           await axios.request(reqOptions)
//           versionFileHasUploaded = true
//         }
//       }
//     } else {
//       console.warn('platform not supported!', platform)
//     }
//   } catch (e) {
//     console.error(e)
//   }
// }

const uploadDist = async () => {
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

        const client = new S3Client(S3Options)
        const uploadDistToS3 = new Upload({
          client,
          params: {
            Bucket: S3_BUCKET,
            Key: `${FILE_PATH}${fileName}`,
            Body: fs.createReadStream(filePath),
            ContentType: 'application/octet-stream'
          }
        })
        // upload dist file
        console.log('[PicGo Dist] Uploading...', fileName, `${index + 1}/${configList[platform].length}`)
        uploadDistToS3.on('httpUploadProgress', progress => {
          console.log(`[PicGo Dist] Uploading... ${progress.loaded}/${progress.total}`)
        })
        await uploadDistToS3.done()

        // upload version file
        if (!versionFileHasUploaded) {
          const uploadVersionFileToS3 = new Upload({
            client,
            params: {
              Bucket: S3_BUCKET,
              Key: `${versionFileName}`,
              Body: fs.createReadStream(versionFilePath),
              ContentType: mime.lookup(versionFileName)
            }
          })
          console.log('[PicGo Version File] Uploading...', versionFileName)
          await uploadVersionFileToS3.done()
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

const main = async () => {
  await uploadDist()
}

main()
