// for referer policy, we can't use it in renderer
import axios from 'axios'
import { RELEASE_URL, RELEASE_URL_BACKUP } from '../../universal/utils/static'
import yaml from 'js-yaml'

export const getLatestVersion = async (isCheckBetaUpdate: boolean = false) => {
  let res: string = ''
  try {
    res = await axios.get(RELEASE_URL, {
      headers: {
        Referer: 'https://github.com'
      }
    }).then(r => {
      const list = r.data as IStringKeyMap[]
      if (isCheckBetaUpdate) {
        const betaList = list.filter(item => item.name.includes('beta'))
        return betaList[0].name
      }
      const normalList = list.filter(item => !item.name.includes('beta'))
      return normalList[0].name
    }).catch(async () => {
      const result = await axios.get(isCheckBetaUpdate ? `${RELEASE_URL_BACKUP}/latest.beta.yml` : `${RELEASE_URL_BACKUP}/latest.yml`, {
        headers: {
          Referer: 'https://github.com'
        }
      })
      const r = yaml.load(result.data) as IStringKeyMap
      return r.version
    })
  } catch (err) {
    console.log(err)
  }
  return res
}
