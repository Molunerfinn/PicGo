import { useState, type SyntheticEvent } from 'react'
import { PICGO_CLOUD_UPLOADER_TYPE } from '#/utils/static'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import {
  PICGO_CLOUD_IMAGE_UNAVAILABLE_SVG_FILENAME,
  PREVIEW_UNAVAILABLE_SVG_FILENAME
} from '@/utils/consts'
import { getRendererStaticFileUrl } from '@/utils/static'

export const PICGO_CLOUD_UNAVAILABLE_SVG_URL = getRendererStaticFileUrl(
  PICGO_CLOUD_IMAGE_UNAVAILABLE_SVG_FILENAME
)

export const PREVIEW_UNAVAILABLE_SVG_URL = getRendererStaticFileUrl(
  PREVIEW_UNAVAILABLE_SVG_FILENAME
)

/**
 * 解析图片的最终展示地址，处理两类失败场景：
 * - PicGo Cloud + lifecycle ∈ {frozen, pending_cleanup}：直接返回 PicGo Cloud 专属占位
 *   SVG（避免远端 503 / 破图）。仅在 type === PICGO_CLOUD_UPLOADER_TYPE 时生效。
 * - 任意 type + 图片实际加载失败（onError 触发）：返回通用「Preview unavailable」占位。
 *   覆盖非图片文件（txt 等）、自定义域名失效、临时网络异常等。
 *
 * motion.img / 自定义 img 渲染器无法直接复用 `CloudImage` 组件，可改用此 hook：
 *   const { src, onError } = useCloudImageSrc(photo.type, photo.imgUrl)
 *   <motion.img src={src} onError={onError} ... />
 */
export function useCloudImageSrc (
  type: string | undefined,
  originalSrc: string | undefined
): {
  src: string | undefined
  onError: (event?: SyntheticEvent<HTMLImageElement>) => void
} {
  const { data: billing } = usePicGoCloudBillingQuery()
  const phase = billing?.lifecycle?.phase
  const isPicGoCloud = type === PICGO_CLOUD_UPLOADER_TYPE
  const isBlocked = isPicGoCloud && (phase === 'frozen' || phase === 'pending_cleanup')
  // failedSrc 记住"上次失败的 src"，originalSrc 变化时自动失效（preview 切图场景）
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined)
  const isLoadFailed = failedSrc !== undefined && failedSrc === originalSrc

  let src = originalSrc
  if (isBlocked) {
    src = PICGO_CLOUD_UNAVAILABLE_SVG_URL
  } else if (isLoadFailed) {
    src = PREVIEW_UNAVAILABLE_SVG_URL
  }

  return {
    src,
    onError: () => {
      if (!isBlocked && !isLoadFailed) {
        setFailedSrc(originalSrc)
      }
    }
  }
}
