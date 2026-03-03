// for referer policy, we can't use it in renderer
import axios from 'axios'
import { RELEASE_URL, RELEASE_URL_BACKUP } from '../../universal/utils/static'
import semver from 'semver'
import yaml from 'js-yaml'

interface IGithubRelease {
  tag_name?: string
  name?: string
  prerelease?: boolean
  draft?: boolean
}

interface IReleaseYAML {
  version?: unknown
}

const REQUEST_HEADERS = {
  Referer: 'https://github.com'
}

function normalizeVersion (version: unknown): string {
  if (typeof version !== 'string') {
    return ''
  }
  const normalized = version.trim().replace(/^v/i, '')
  return semver.valid(normalized) ?? ''
}

function pickLatestVersion (versions: string[]): string {
  return versions.reduce((latest, current) => {
    if (latest === '' || semver.gt(current, latest)) {
      return current
    }
    return latest
  }, '')
}

async function fetchLatestVersionFromGitHub (isCheckBetaUpdate: boolean): Promise<string> {
  const response = await axios.get(RELEASE_URL, {
    headers: REQUEST_HEADERS
  })
  const releaseList: IGithubRelease[] = Array.isArray(response.data) ? response.data : []

  const versions = releaseList.flatMap((release) => {
    if (release.draft) {
      return []
    }
    if (!isCheckBetaUpdate && release.prerelease) {
      return []
    }

    const version = normalizeVersion(release.tag_name ?? release.name)
    return version ? [version] : []
  })

  return pickLatestVersion(versions)
}

async function fetchVersionFromBackupYAML (fileName: 'latest.yml' | 'latest.beta.yml'): Promise<string> {
  const response = await axios.get(`${RELEASE_URL_BACKUP}/${fileName}`, {
    headers: REQUEST_HEADERS
  })
  const releaseInfo = yaml.load(response.data)

  if (typeof releaseInfo !== 'object' || releaseInfo === null) {
    return ''
  }

  return normalizeVersion((releaseInfo as IReleaseYAML).version)
}

async function fetchLatestVersionFromBackup (isCheckBetaUpdate: boolean): Promise<string> {
  if (!isCheckBetaUpdate) {
    return fetchVersionFromBackupYAML('latest.yml')
  }

  const settled = await Promise.allSettled([
    fetchVersionFromBackupYAML('latest.yml'),
    fetchVersionFromBackupYAML('latest.beta.yml')
  ])

  const versions: string[] = []
  settled.forEach((item) => {
    if (item.status === 'fulfilled' && item.value) {
      versions.push(item.value)
    }
  })

  return pickLatestVersion(versions)
}

export const getLatestVersion = async (isCheckBetaUpdate: boolean = false) => {
  try {
    const version = await fetchLatestVersionFromGitHub(isCheckBetaUpdate)
    if (version) {
      return version
    }
  } catch (err) {
    console.log(err)
  }

  try {
    return await fetchLatestVersionFromBackup(isCheckBetaUpdate)
  } catch (err) {
    console.log(err)
    return ''
  }
}
