const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const yaml = require('js-yaml')

const distDir = path.join(__dirname, '../dist')
const yamlPath = path.join(distDir, 'latest.yml')

if (!fs.existsSync(yamlPath)) {
  console.log('⚠️ latest.yml not found in dist/. Skipping update.')
  process.exit(0)
}

console.log(`Reading ${yamlPath}...`)
const yamlContent = fs.readFileSync(yamlPath, 'utf8')
let doc

try {
  doc = yaml.load(yamlContent)
} catch (e) {
  console.error('❌ Failed to parse latest.yml:', e)
  process.exit(1)
}

// Get all .exe files in dist directory
const files = fs.readdirSync(distDir).filter(f => f.endsWith('.exe'))

if (files.length === 0) {
  console.log('⚠️ No .exe files found in dist/.')
  process.exit(0)
}

let updated = false

files.forEach(file => {
  const filePath = path.join(distDir, file)
  
  // 1. Calculate new Hash and Size
  const buffer = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha512').update(buffer).digest('base64')
  const size = fs.statSync(filePath).size

  console.log(`Processing ${file}:`)
  console.log(`  -> New Hash: ${hash}`)
  console.log(`  -> New Size: ${size}`)

  // 2. Update entries in 'files' list
  if (Array.isArray(doc.files)) {
    const fileEntry = doc.files.find(f => f.url === file)
    if (fileEntry) {
      fileEntry.sha512 = hash
      fileEntry.size = size
      updated = true
      console.log('  -> Updated file entry in yaml object')
    }
  }

  // 3. Update root path entry (if exists)
  // electron-builder's latest.yml usually has root path, sha512, size 
  // corresponding to the main file of current build (usually x64 or current arch)
  if (doc.path === file) {
    doc.sha512 = hash
    doc.size = size 
    updated = true
    console.log('  -> Updated root path entry in yaml object')
  }
})

if (updated) {
  // 4. Dump back to file
  // lineWidth: -1 prevents long strings from wrapping, keeping it clean
  const newYamlContent = yaml.dump(doc, { lineWidth: -1 })
  fs.writeFileSync(yamlPath, newYamlContent, 'utf8')
  console.log('✅ latest.yml updated successfully.')
  console.log('New yaml content:')
  console.log(newYamlContent)
} else {
  console.log('⚠️ No matching entries found in latest.yml to update.')
}