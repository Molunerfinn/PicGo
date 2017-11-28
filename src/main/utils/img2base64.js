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
  result.push({
    base64Image: file.imgUrl.replace(/^data\S+,/, ''),
    width: file.width,
    height: file.height
  })
  return result
}

export {
  imgFromPath,
  imgFromClipboard
}
