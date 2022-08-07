// fork from https://github.com/sindresorhus/macos-version
// cause I can't change it to common-js module
import process from 'process'
import fs from 'fs'
import semver from 'semver'

export const isMacOS = process.platform === 'darwin'

let version: string | undefined

const clean = (version: string) => {
  const { length } = version.split('.')

  if (length === 1) {
    return `${version}.0.0`
  }

  if (length === 2) {
    return `${version}.0`
  }

  return version
}

const parseVersion = (plist: string) => {
  const matches = /<key>ProductVersion<\/key>\s*<string>([\d.]+)<\/string>/.exec(plist)
  if (!matches) {
    return
  }

  return matches[1].replace('10.16', '11')
}

export function macOSVersion (): string {
  if (!isMacOS) {
    return ''
  }

  if (!version) {
    const file = fs.readFileSync('/System/Library/CoreServices/SystemVersion.plist', 'utf8')
    const matches = parseVersion(file)

    if (!matches) {
      return ''
    }

    version = clean(matches)
  }

  return version
}

if (process.env.NODE_ENV === 'test') {
  macOSVersion._parseVersion = parseVersion
}

export function isMacOSVersion (semverRange: string) {
  if (!isMacOS) {
    return false
  }

  semverRange = semverRange.replace('10.16', '11')

  return semver.satisfies(macOSVersion(), clean(semverRange))
}

export function isMacOSVersionGreaterThanOrEqualTo (version: string) {
  if (!isMacOS) {
    return false
  }

  version = version.replace('10.16', '11')

  return semver.gte(macOSVersion(), clean(version))
}

export function assertMacOSVersion (semverRange: string) {
  semverRange = semverRange.replace('10.16', '11')

  if (!isMacOSVersion(semverRange)) {
    throw new Error(`Requires macOS ${semverRange}`)
  }
}

export function assertMacOSVersionGreaterThanOrEqualTo (version: string) {
  version = version.replace('10.16', '11')

  if (!isMacOSVersionGreaterThanOrEqualTo(version)) {
    throw new Error(`Requires macOS ${version} or later`)
  }
}

export function assertMacOS () {
  if (!isMacOS) {
    throw new Error('Requires macOS')
  }
}
