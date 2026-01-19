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
const distPath = path.join(__dirname, '../dist')
const S3Client = require('@aws-sdk/client-s3').S3Client
const Upload = require('@aws-sdk/lib-storage').Upload
// const BUCKET = 'picgo-1251750343'
// const COS_SECRET_ID = process.env.PICGO_ENV_COS_SECRET_ID
// const COS_SECRET_KEY = process.env.PICGO_ENV_COS_SECRET_KEY

const S3_BUCKET = 'release'
const S3_LEGACY_BUCKET = 'picgo'
// const AREA = 'ap-chengdu'
const VERSION = pkg.version
const FILE_PATH = `${VERSION}/`
const S3_SECRET_ID = process.env.PICGO_ENV_S3_SECRET_ID
const S3_SECRET_KEY = process.env.PICGO_ENV_S3_SECRET_KEY
const S3_ACCOUNT_ID = process.env.PICGO_ENV_S3_ACCOUNT_ID
const S3_LEGACY_SECRET_ID = process.env.PICGO_ENV_S3_LEGACY_SECRET_ID
const S3_LEGACY_SECRET_KEY = process.env.PICGO_ENV_S3_LEGACY_SECRET_KEY
const S3_LEGACY_ACCOUNT_ID = process.env.PICGO_ENV_S3_LEGACY_ACCOUNT_ID

const S3Options = {
  credentials: {
    accessKeyId: S3_SECRET_ID,
    secretAccessKey: S3_SECRET_KEY
  },
  endpoint: `https://${S3_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  sslEnabled: true,
  region: 'auto'
}

// for legacy release file fetch
const S3LegacyOptions = {
  credentials: {
    accessKeyId: S3_LEGACY_SECRET_ID,
    secretAccessKey: S3_LEGACY_SECRET_KEY
  },
  endpoint: `https://${S3_LEGACY_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  sslEnabled: true,
  region: 'auto'
}


const uploadDist = async () => {
  try {
    const platform = process.platform
    if (configList[platform]) {
      const uploadedVersionFiles = new Set()
      for (const [index, config] of configList[platform].entries()) {
        const fileName = `${config.appNameWithPrefix}-${VERSION}-${config.arch}.${config.ext}`
        const filePath = path.join(distPath, fileName)
        const versionFilePath = path.join(distPath, config['version-file'])
        let versionFileName = config['version-file']
        if (VERSION.toLocaleLowerCase().includes('beta')) {
          versionFileName = versionFileName.replace('.yml', '.beta.yml')
        }
        console.log('[PicGo Dist] Preparing to upload', fileName)
        const client = new S3Client(S3Options)
        if (fs.existsSync(filePath)) {
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
        } else {
          console.warn('[PicGo Dist] File not found:', fileName)
        }

        // upload version file
        if (!uploadedVersionFiles.has(versionFileName) && fs.existsSync(versionFilePath)) {
          const uploadVersionFileToS3 = new Upload({
            client,
            params: {
              Bucket: S3_BUCKET,
              Key: `${versionFileName}`,
              Body: fs.createReadStream(versionFilePath),
              ContentType: mime.lookup(versionFileName)
            }
          })
          // upload to legacy bucket as well
          // will be deprecated in 2.5.0
          const legacyClient = new S3Client(S3LegacyOptions)
          const uploadVersionFileToLegacyS3 = new Upload({
            client: legacyClient,
            params: {
              Bucket: S3_LEGACY_BUCKET,
              Key: `${versionFileName}`,
              Body: fs.createReadStream(versionFilePath),
              ContentType: mime.lookup(versionFileName)
            }
          })
          console.log('[PicGo Version File] Uploading...', versionFileName)
          await uploadVersionFileToS3.done()
          await uploadVersionFileToLegacyS3.done()
          uploadedVersionFiles.add(versionFileName)
          console.log('[PicGo Version File] Upload successfully')
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
