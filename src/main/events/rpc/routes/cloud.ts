import { IRPCActionType } from '~/universal/types/enum'
import { RPCRouter } from '../router'
import picgo from '@core/picgo'
import type { IPicGoCloudUserInfo } from '#/types/cloud'
import axios from 'axios'
import { T } from '~/main/i18n'
import { fail, ok } from '../utils'

const cloudRouter = new RPCRouter()

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000

type ICloudWithGetUserInfo = {
  getUserInfo: () => Promise<IPicGoCloudUserInfo | null>
}

const hasGetUserInfo = (cloud: unknown): cloud is ICloudWithGetUserInfo => {
  return typeof (cloud as { getUserInfo?: unknown }).getUserInfo === 'function'
}

const getUserInfo = async (): Promise<IPicGoCloudUserInfo | null> => {
  const cloud = picgo.cloud
  if (hasGetUserInfo(cloud)) {
    return await cloud.getUserInfo()
  }

  // Backward-compatible fallback (for older picgo-core versions without `cloud.getUserInfo`).
  const token = picgo.getConfig<string | undefined>('settings.picgoCloud.token')
  if (!token) return null

  type IAxiosErrorLike = {
    response?: {
      status?: number
      data?: unknown
    }
    message?: string
  }

  const baseURL = process.env.PICGO_CLOUD_API_URL || 'https://picgo.app'
  try {
    const res = await axios.request<IPicGoCloudUserInfo>({
      method: 'GET',
      baseURL,
      url: '/api/whoami',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return res.data
  } catch (e: unknown) {
    const errorLike = (typeof e === 'object' && e !== null) ? (e as IAxiosErrorLike) : null
    const status = errorLike?.response?.status
    if (status === 401 || status === 403) {
      // Treat invalid token as logged-out and clear it for later retries.
      picgo.cloud.logout()
      return null
    }
    const message = (errorLike?.response?.data as { message?: string } | undefined)?.message
      ?? errorLike?.message
      ?? String(e)
    throw new Error(message)
  }
}

const loginWithTimeout = async (): Promise<void> => {
  const loginPromise = picgo.cloud.login()

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      picgo.cloud.disposeLoginFlow()
      reject(new Error(T('PICGO_CLOUD_LOGIN_TIMEOUT')))
    }, LOGIN_TIMEOUT_MS)
  })

  try {
    await Promise.race([loginPromise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    // Avoid unhandled rejection when timeout disposes the core login flow.
    loginPromise.catch(() => {})
  }
}

cloudRouter
  .add(IRPCActionType.PICGO_CLOUD_GET_USER_INFO, async () => {
    try {
      const userInfo = await getUserInfo()
      return ok(userInfo)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_LOGIN, async () => {
    try {
      await loginWithTimeout()
      const userInfo = await getUserInfo()
      if (!userInfo) {
        return fail(T('PICGO_CLOUD_LOGIN_FAILED'))
      }
      return ok(userInfo)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_LOGOUT, async () => {
    try {
      picgo.cloud.logout()
      return ok(true)
    } catch (e) {
      return fail(e)
    }
  })
  .add(IRPCActionType.PICGO_CLOUD_DISPOSE_LOGIN_FLOW, async () => {
    try {
      picgo.cloud.disposeLoginFlow()
      return ok(true)
    } catch (e) {
      return fail(e)
    }
  })

export {
  cloudRouter
}
