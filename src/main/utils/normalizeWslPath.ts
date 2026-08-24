const RELATIVE_WSL_PATH = /^wsl\$[\\/]/i

/**
 * Convert the WSL network-share path emitted by some Windows integrations to
 * a UNC path that Node.js can read.
 *
 * Windows exposes WSL files through paths such as `\\\\wsl$\\<distribution>\\...`,
 * while integrations such as Typora may omit the leading UNC separators.
 */
export const normalizeWslPath = (filePath: string, platform: NodeJS.Platform = process.platform): string => {
  if (platform !== 'win32' || !RELATIVE_WSL_PATH.test(filePath)) {
    return filePath
  }

  const normalizedPath = filePath.replaceAll('/', '\\').replace(/\\+/g, '\\')
  const relativeWslPath = normalizedPath.replace(/^wsl\$\\+/i, 'wsl$\\')
  return `\\\\${relativeWslPath}`
}
