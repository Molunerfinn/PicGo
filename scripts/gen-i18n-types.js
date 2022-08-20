const yaml = require('js-yaml')
const path = require('path')
const fs = require('fs')
const languageFileName = 'zh-CN.yml' // use zh-CN for type is OK
const i18nFolder = path.join(__dirname, '../public/i18n')
const typeFolder = path.join(__dirname, '../src/universal/types')
const languageFile = path.join(i18nFolder, languageFileName)

const langFile = fs.readFileSync(languageFile, 'utf8')

const obj = yaml.load(langFile)

const keys = Object.keys(obj)

const types =
`interface ILocales {
  ${keys.map(key => `${key}: string`).join('\n  ')}
}
type ILocalesKey = keyof ILocales
`

fs.writeFileSync(path.join(typeFolder, 'i18n.d.ts'), types)
