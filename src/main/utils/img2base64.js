import fs from 'fs-extra'
import path from 'path'
import sizeOf from 'image-size'

const imgFromPath = async (imgPath) => {
  let results = []
  await Promise.all(imgPath.map(async item => {
    let buffer = await fs.readFile(item)
    let base64Image = Buffer.from(buffer, 'binary').toString('base64')
    let fileName = path.basename(item)
    let imgSize = sizeOf(item)
    results.push({
      base64Image,
      fileName,
      width: imgSize.width,
      height: imgSize.height
    })
  }))
  return results
}

const imgFromClipboard = (file) => {
  let result = []
  const today = new Date().toLocaleString()
  result.push({
    base64Image: file.imgUrl.replace(/^data\S+,/, ''),
    fileName: `${today}.png`,
    width: file.width,
    height: file.height
  })
  return result
}

const imgFromUploader = async (files) => {
  let results = []
  await Promise.all(files.map(async item => {
    let buffer = await fs.readFile(item.path)
    let base64Image = Buffer.from(buffer, 'binary').toString('base64')
    let fileName = item.name
    let imgSize = sizeOf(item.path)
    results.push({
      base64Image,
      fileName,
      width: imgSize.width,
      height: imgSize.height
    })
  }))
  return results
}

export {
  imgFromPath,
  imgFromClipboard,
  imgFromUploader
}
