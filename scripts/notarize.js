require('dotenv').config()

const { notarize } = require('@electron/notarize')
const { APPLE_ID, APPLE_TEAM_ID, APPLE_APP_SPECIFIC_PASSWORD } = process.env
const APP_BUNDLE_ID = 'com.molunerfinn.picgo'

async function main(context) {
  const { electronPlatformName, appOutDir, packager } = context

  if (
    electronPlatformName !== 'darwin' ||
    !APPLE_ID ||
    !APPLE_APP_SPECIFIC_PASSWORD ||
    !APPLE_TEAM_ID
  ) {
    console.log('Skip notarization.')
    return
  }

  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  const now = Date.now()

  console.log('Starting Apple notarization for', appPath)

  await notarize({
    appPath,
    appBundleId: APP_BUNDLE_ID,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID
  })

  console.log('Finished Apple notarization for', appPath, `in ${(Date.now() - now) / 1000}s`)
}


module.exports = main
