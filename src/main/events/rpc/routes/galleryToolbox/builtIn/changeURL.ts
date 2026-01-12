import { logger } from '@picgo/i18n'
import { PicGoUtils, type IPicGo } from 'picgo'
import { T } from '~/main/i18n'

interface IUrlRewriteRule {
  match: string
  replace: string
  enable?: boolean
  global?: boolean
  ignoreCase?: boolean
}

interface IUrlRewriteDialogResult {
  applyGlobalRules?: boolean
  match?: string
  replace?: string
  global?: boolean
  ignoreCase?: boolean
}

function normalizeRules (value: unknown): IUrlRewriteRule[] {
  if (!Array.isArray(value)) return []
  return value.map(item => {
    const raw = (item ?? {}) as Partial<Record<keyof IUrlRewriteRule, unknown>>
    return {
      match: String(raw.match ?? ''),
      replace: String(raw.replace ?? ''),
      enable: raw.enable === false ? false : true,
      global: raw.global === true,
      ignoreCase: raw.ignoreCase === true
    }
  }).filter(rule => rule.match.length > 0)
}

function buildFlags (rule: Pick<IUrlRewriteRule, 'global' | 'ignoreCase'>): string {
  return `${rule.global ? 'g' : ''}${rule.ignoreCase ? 'i' : ''}`
}

function validateRuleOrThrow (rule: IUrlRewriteRule) {
  if (!rule.match.trim() || !rule.replace.trim()) {
    throw new Error(T('GALLERY_URL_REWRITE_TEMP_RULE_REQUIRED'))
  }
  try {
    new RegExp(rule.match, buildFlags(rule))
  } catch (error) {
    const message = `Invalid URL rewrite regex pattern "${rule.match}": ${error instanceof Error ? error.message : String(error)}`
    logger.error(message)
    throw new Error(message)
  }
}

function applyFirstMatchRewrite (ctx: IPicGo, imgItem: ImgInfo, rules: IUrlRewriteRule[]): ImgInfo {
  const imgInfo = {
    imgUrl: imgItem.imgUrl,
    originImgUrl: imgItem.originImgUrl
  }
  PicGoUtils.applyUrlRewriteToImgInfo(imgInfo, rules, {
    log: {
      error: (...args: Parameters<IPicGo['log']['error']>) => ctx.log.error(...args),
      warn: () => ctx.log.warn(T('GALLERY_URL_REWRITE_EMPTY_RESULT_WARN'))
    }
  })
  if (imgInfo.imgUrl === '') return imgItem
  return imgInfo
}

export const galleryMenu = () => {
  return [{
    label: T('GALLERY_URL_REWRITE_TITLE'),
    async handle (ctx: IPicGo, guiApi: IGuiApi, selectedList: ImgInfo[] = []) {
      if (!selectedList.length) {
        guiApi.showNotification({
          title: T('GALLERY_URL_REWRITE_TITLE'),
          body: T('GALLERY_URL_REWRITE_WARN_NO_SELECTION')
        })
        logger.warn(T('GALLERY_URL_REWRITE_WARN_NO_SELECTION'))
        return
      }

      const globalRules = normalizeRules(ctx.getConfig('settings.urlRewrite.rules'))

      const config: IPicGoPluginConfig[] = [
        {
          alias: T('GALLERY_URL_REWRITE_APPLY_GLOBAL_RULES'),
          name: 'applyGlobalRules',
          type: 'confirm',
          default: globalRules.length > 0,
          required: false,
          confirmText: T('SETTINGS_OPEN'),
          cancelText: T('SETTINGS_CLOSE'),
          tips: `${T('GALLERY_URL_REWRITE_GLOBAL_RULES_COUNT')}: ${globalRules.length}`
        },
        {
          alias: T('URL_REWRITE_MATCH'),
          name: 'match',
          type: 'input',
          message: T('URL_REWRITE_MATCH_PLACEHOLDER'),
          default: '',
          required: false,
          tips: `${T('GALLERY_URL_REWRITE_TEMP_RULE_TIPS')}\n\n${T('URL_REWRITE_MATCH_TIPS')}`
        },
        {
          alias: T('URL_REWRITE_REPLACE'),
          name: 'replace',
          type: 'input',
          message: T('URL_REWRITE_REPLACE_PLACEHOLDER'),
          default: '',
          required: false,
          tips: T('URL_REWRITE_REPLACE_TIPS')
        },
        {
          alias: T('URL_REWRITE_FLAG_GLOBAL_LABEL'),
          name: 'global',
          type: 'confirm',
          default: false,
          required: false,
          confirmText: 'g',
          cancelText: '-',
          tips: T('URL_REWRITE_FLAG_GLOBAL_DESC')
        },
        {
          alias: T('URL_REWRITE_FLAG_IGNORE_CASE_LABEL'),
          name: 'ignoreCase',
          type: 'confirm',
          default: false,
          required: false,
          confirmText: 'i',
          cancelText: '-',
          tips: T('URL_REWRITE_FLAG_IGNORE_CASE_DESC')
        }
      ]
      const options: IPicGoPluginShowConfigDialogOption = {
        title: T('GALLERY_URL_REWRITE_TITLE'),
        config
      }
      const res = await guiApi.showConfigDialog<IUrlRewriteDialogResult>(options)
      if (!res) return

      const applyGlobalRules = res.applyGlobalRules === true
      const tempMatch = String(res.match ?? '').trim()
      const tempReplace = String(res.replace ?? '').trim()

      const hasTempRuleInput = tempMatch.length > 0 || tempReplace.length > 0
      let tempRule: IUrlRewriteRule | null = null
      if (hasTempRuleInput) {
        tempRule = {
          match: tempMatch,
          replace: tempReplace,
          enable: true,
          global: res.global === true,
          ignoreCase: res.ignoreCase === true
        }
      }

      if (tempRule) {
        try {
          validateRuleOrThrow(tempRule)
        } catch (e: any) {
          guiApi.showNotification({
            title: T('GALLERY_URL_REWRITE_TITLE'),
            body: e.message
          })
          return
        }
      }

      if (!applyGlobalRules && !tempRule) {
        guiApi.showNotification({
          title: T('GALLERY_URL_REWRITE_TITLE'),
          body: T('GALLERY_URL_REWRITE_NO_RULES_TO_APPLY')
        })
        return
      }

      let shouldSaveTempRule = false
      if (tempRule) {
        const saveRes = await guiApi.showMessageBox({
          title: T('GALLERY_URL_REWRITE_TITLE'),
          message: T('GALLERY_URL_REWRITE_SAVE_TEMP_RULE_PROMPT'),
          type: 'info',
          buttons: [
            T('GALLERY_URL_REWRITE_APPLY_AND_SAVE'),
            T('GALLERY_URL_REWRITE_APPLY_ONLY'),
            T('CANCEL')
          ]
        })
        if (saveRes.result === 2) return
        shouldSaveTempRule = saveRes.result === 0
      }

      const rulesToApply: IUrlRewriteRule[] = [
        ...(tempRule ? [tempRule] : []),
        ...(applyGlobalRules ? globalRules : [])
      ]

      const changedList = selectedList.map((item) => {
        const current = item.imgUrl || ''
        if (!current) return false
        const next = applyFirstMatchRewrite(ctx, item, rulesToApply)
        if (next.imgUrl === current) return false
        return {
          id: item.id,
          imgUrl: next.imgUrl,
          originImgUrl: next.originImgUrl
        } as ImgInfo
      }).filter(Boolean) as ImgInfo[]

      if (changedList.length === 0) {
        guiApi.showNotification({
          title: T('GALLERY_URL_REWRITE_RESULT_TITLE'),
          body: T('GALLERY_URL_REWRITE_NO_CHANGES')
        })
        return
      }

      if (shouldSaveTempRule && tempRule) {
        const nextGlobalRules = [...globalRules, tempRule]
        ctx.saveConfig({
          'settings.urlRewrite.rules': nextGlobalRules
        })
      }

      const updateRes = await guiApi.galleryDB.updateMany(changedList)
      guiApi.showNotification({
        title: T('GALLERY_URL_REWRITE_RESULT_TITLE'),
        body: `${T('SUCCESS')}: ${updateRes.success} ${T('FAILED')}: ${updateRes.total - updateRes.success}`
      })
    }
  }]
}
