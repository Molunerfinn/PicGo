/**
 * Merge artifacts from different platforms and architectures
 * Also merge latest*.yml files for electron-updater
 */

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts')
const DIST_DIR = path.join(__dirname, '../dist')

// yml 文件分组规则
const YML_MERGE_RULES = {
  // macOS: 合并 x64 和 arm64 的 latest-mac.yml
  'latest-mac.yml': ['latest-mac.yml'],
  // Windows: 合并所有架构的 latest.yml
  'latest.yml': ['latest.yml'],
  // Linux x64: latest-linux.yml
  'latest-linux.yml': ['latest-linux.yml'],
  // Linux arm64: latest-linux-arm64.yml
  'latest-linux-arm64.yml': ['latest-linux-arm64.yml']
}

/**
 * 递归查找指定文件名的所有文件
 */
function findFiles(dir, filename) {
  const results = []

  if (!fs.existsSync(dir)) {
    return results
  }

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath, filename))
    } else if (item === filename) {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * 合并多个 yml 文件
 */
function mergeYmlFiles(files) {
  if (files.length === 0) return null
  if (files.length === 1) {
    return yaml.load(fs.readFileSync(files[0], 'utf8'))
  }

  const contents = files.map(f => yaml.load(fs.readFileSync(f, 'utf8')))

  // 以第一个为基准，合并 files 数组
  const merged = {
    version: contents[0].version,
    files: [],
    releaseDate: contents[0].releaseDate
  }

  for (const content of contents) {
    if (content.files && Array.isArray(content.files)) {
      merged.files.push(...content.files)
    }
  }

  // 去重（根据 sha512）
  const seen = new Set()
  merged.files = merged.files.filter(file => {
    const key = file.sha512
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 设置 path/sha512/size 为第一个文件（electron-updater 兼容性）
  if (merged.files.length > 0) {
    merged.path = merged.files[0].url
    merged.sha512 = merged.files[0].sha512
    merged.size = merged.files[0].size
  }

  return merged
}

/**
 * 复制所有构建产物到 dist 目录
 */
function copyArtifacts() {
  console.log('📁 Copying all artifacts to dist...\n')

  if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.log('⚠️  No artifacts directory found')
    return
  }

  const platformDirs = fs.readdirSync(ARTIFACTS_DIR)

  for (const platformDir of platformDirs) {
    const platformPath = path.join(ARTIFACTS_DIR, platformDir)
    const stat = fs.statSync(platformPath)

    if (!stat.isDirectory()) continue

    console.log(`📦 Processing ${platformDir}...`)
    const files = fs.readdirSync(platformPath)

    for (const file of files) {
      const srcPath = path.join(platformPath, file)
      const destPath = path.join(DIST_DIR, file)
      const fileStat = fs.statSync(srcPath)

      // 跳过目录和 yml 文件（yml 文件会单独处理合并）
      if (fileStat.isDirectory()) continue
      if (file.endsWith('.yml')) continue

      // 如果目标文件已存在且大小相同，跳过
      if (fs.existsSync(destPath)) {
        const destStat = fs.statSync(destPath)
        if (destStat.size === fileStat.size) {
          console.log(`   ⏭️  Skipped (exists): ${file}`)
          continue
        }
      }

      fs.copyFileSync(srcPath, destPath)
      console.log(`   ✅ Copied: ${file}`)
    }
  }
}

/**
 * 合并 yml 文件
 */
function mergeYmlFilesFromArtifacts() {
  console.log('\n🔀 Merging yml files...\n')

  for (const [outputName, sourceNames] of Object.entries(YML_MERGE_RULES)) {
    const allFiles = []

    for (const sourceName of sourceNames) {
      const files = findFiles(ARTIFACTS_DIR, sourceName)
      allFiles.push(...files)
    }

    if (allFiles.length === 0) {
      console.log(`⏭️  No ${outputName} found, skipping...`)
      continue
    }

    console.log(`📄 Found ${allFiles.length} ${outputName} file(s):`)
    allFiles.forEach(f => console.log(`   - ${path.relative(ARTIFACTS_DIR, f)}`))

    const merged = mergeYmlFiles(allFiles)

    if (merged) {
      const outputPath = path.join(DIST_DIR, outputName)
      fs.writeFileSync(outputPath, yaml.dump(merged, { lineWidth: -1 }))
      console.log(`✅ Merged -> ${outputName}`)

      if (merged.files) {
        console.log(`   Files: ${merged.files.map(f => f.url).join(', ')}`)
      }
      console.log('')
    }
  }
}

async function main() {
  console.log('🚀 Starting artifact merge process...\n')

  // 确保 dist 目录存在
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true })
  }

  // 1. 复制所有构建产物
  copyArtifacts()

  // 2. 合并 yml 文件
  mergeYmlFilesFromArtifacts()

  console.log('🎉 Artifact merge completed!')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
