import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RELEASE_URL, RELEASE_URL_BACKUP } from '#/utils/static'
import { getLatestVersion } from '~/main/utils/getLatestVersion'

const { axiosGetMock } = vi.hoisted(() => {
  return {
    axiosGetMock: vi.fn()
  }
})

vi.mock('axios', () => {
  return {
    default: {
      get: axiosGetMock
    }
  }
})

describe('main/utils/getLatestVersion', () => {
  beforeEach(() => {
    axiosGetMock.mockReset()
  })

  it('returns stable release when beta channel is older', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: [
        { tag_name: 'v2.5.2', prerelease: false, draft: false },
        { tag_name: 'v2.4.2-beta.0', prerelease: true, draft: false }
      ]
    })

    const version = await getLatestVersion(true)

    expect(version).toBe('2.5.2')
    expect(axiosGetMock).toHaveBeenCalledWith(RELEASE_URL, {
      headers: {
        Referer: 'https://github.com'
      }
    })
  })

  it('returns prerelease when beta channel has a newer version', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: [
        { tag_name: 'v2.5.2', prerelease: false, draft: false },
        { tag_name: 'v2.6.0-beta.1', prerelease: true, draft: false }
      ]
    })

    const version = await getLatestVersion(true)

    expect(version).toBe('2.6.0-beta.1')
  })

  it('ignores prerelease when beta updates are disabled', async () => {
    axiosGetMock.mockResolvedValueOnce({
      data: [
        { tag_name: 'v2.6.0-beta.1', prerelease: true, draft: false },
        { tag_name: 'v2.5.2', prerelease: false, draft: false }
      ]
    })

    const version = await getLatestVersion(false)

    expect(version).toBe('2.5.2')
  })

  it('fallback compares stable and beta backup metadata when beta updates are enabled', async () => {
    axiosGetMock.mockRejectedValueOnce(new Error('network down'))
    axiosGetMock.mockResolvedValueOnce({
      data: 'version: 2.5.2'
    })
    axiosGetMock.mockResolvedValueOnce({
      data: 'version: 2.4.2-beta.0'
    })

    const version = await getLatestVersion(true)

    expect(version).toBe('2.5.2')
    expect(axiosGetMock).toHaveBeenNthCalledWith(2, `${RELEASE_URL_BACKUP}/latest.yml`, {
      headers: {
        Referer: 'https://github.com'
      }
    })
    expect(axiosGetMock).toHaveBeenNthCalledWith(3, `${RELEASE_URL_BACKUP}/latest.beta.yml`, {
      headers: {
        Referer: 'https://github.com'
      }
    })
  })

  it('fallback uses only stable backup metadata when beta updates are disabled', async () => {
    axiosGetMock.mockRejectedValueOnce(new Error('network down'))
    axiosGetMock.mockResolvedValueOnce({
      data: 'version: 2.5.2'
    })

    const version = await getLatestVersion(false)

    expect(version).toBe('2.5.2')
    expect(axiosGetMock).toHaveBeenCalledTimes(2)
    expect(axiosGetMock).toHaveBeenNthCalledWith(2, `${RELEASE_URL_BACKUP}/latest.yml`, {
      headers: {
        Referer: 'https://github.com'
      }
    })
  })
})
