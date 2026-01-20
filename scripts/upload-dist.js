// upload dist bundled-app to r2
// upload version file to cos

require('dotenv').config()
const fs = require('fs')
const pkg = require('../package.json')
const configList = require('./config')
const mime = require('mime-types')
const path = require('path')
const distPath = path.join(__dirname, '../dist')
const S3Client = require('@aws-sdk/client-s3').S3Client
const Upload = require('@aws-sdk/lib-storage').Upload
const uploadToDev = process.argv.includes('--dev')

const S3_BUCKET = 'release'
const S3_LEGACY_BUCKET = 'picgo'
const VERSION = pkg.version
const FILE_PATH =  uploadToDev ? `dev/${VERSION}/` : `${VERSION}/`
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

/**
 * 检查是否使用 --all 参数（上传所有平台）
 */
function shouldUploadAll() {
  return process.argv.includes('--all')
}

/**
 * 获取要上传的配置列表
 */
function getUploadConfigs() {
  if (shouldUploadAll()) {
    // 合并所有平台的配置
    return [
      ...configList.darwin,
      ...configList.win32,
      ...configList.linux
    ]
  }
  // 原有逻辑：根据当前平台
  const platform = process.platform
  return configList[platform] || []
}

/**
 * 上传单个文件到 S3
 */
async function uploadFileToS3(client, bucket, key, filePath, contentType = 'application/octet-stream') {
  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentType
    }
  })

  upload.on('httpUploadProgress', progress => {
    const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0
    process.stdout.write(`\r   Progress: ${progress.loaded}/${progress.total || '?'} (${percent}%)`)
  })

  await upload.done()
  console.log('') // 换行
}

const uploadDist = async () => {
  try {
    const configs = getUploadConfigs()

    if (configs.length === 0) {
      console.warn('[PicGo] No upload config found!')
      return
    }

    console.log(`[PicGo] Upload mode: ${shouldUploadAll() ? 'ALL PLATFORMS' : process.platform}`)
    console.log(`[PicGo] Version: ${VERSION}`)
    console.log(`[PicGo] Total files to upload: ${configs.length}\n`)

    const uploadedVersionFiles = new Set()
    const client = new S3Client(S3Options)
    const legacyClient = new S3Client(S3LegacyOptions)

    for (const [index, config] of configs.entries()) {
      const fileName = `${config.appNameWithPrefix}-${VERSION}-${config.arch}.${config.ext}`
      const filePath = path.join(distPath, fileName)
      let versionFileName = config['version-file']

      // Beta 版本使用不同的 yml 文件名
      if (VERSION.toLowerCase().includes('beta')) {
        versionFileName = versionFileName.replace('.yml', '.beta.yml')
      }

      console.log(`[${index + 1}/${configs.length}] Processing ${fileName}`)

      // 上传构建产物
      if (fs.existsSync(filePath)) {
        console.log(`   Uploading to S3: ${FILE_PATH}${fileName}`)
        await uploadFileToS3(client, S3_BUCKET, `${FILE_PATH}${fileName}`, filePath)
        console.log(`   ✅ Uploaded: ${fileName}`)
      } else {
        console.warn(`   ⚠️  File not found: ${fileName}`)
      }

      // 上传版本文件（每个 yml 只上传一次）
      const versionFilePath = path.join(distPath, versionFileName)
      if (!uploadedVersionFiles.has(versionFileName) && fs.existsSync(versionFilePath)) {
        console.log(`   Uploading version file: ${versionFileName}`)

        // 上传到主 bucket
        await uploadFileToS3(
          client,
          S3_BUCKET,
          versionFileName,
          versionFilePath,
          mime.lookup(versionFileName) || 'text/yaml'
        )

        // 上传到 legacy bucket
        await uploadFileToS3(
          legacyClient,
          S3_LEGACY_BUCKET,
          versionFileName,
          versionFilePath,
          mime.lookup(versionFileName) || 'text/yaml'
        )

        uploadedVersionFiles.add(versionFileName)
        console.log(`   ✅ Version file uploaded: ${versionFileName}`)
      }

      console.log('')
    }

    console.log('[PicGo] 🎉 All uploads completed!')
  } catch (e) {
    console.error('[PicGo] ❌ Upload error:', e)
    process.exit(1)
  }
}

const main = async () => {
  await uploadDist()
}

main()
