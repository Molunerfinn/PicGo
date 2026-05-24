import { useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react'
import { PICGO_CLOUD_UPLOADER_TYPE } from '#/utils/static'
import { usePicGoCloudBillingQuery } from '@/queries/picgo-cloud-billing'
import { PICGO_CLOUD_IMAGE_UNAVAILABLE_SVG_FILENAME } from '@/utils/consts'
import { getRendererStaticFileUrl } from '@/utils/static'

type ImgProps = ImgHTMLAttributes<HTMLImageElement>

interface CloudImageProps extends Omit<ImgProps, 'type'> {
  /**
   * 图片对应的图床 type（来自 ImgInfo.type）。当 type === 'picgo-cloud' 时启用
   * lifecycle 占位保护——其他图床（包括用户自定义域名走 PicGo Cloud 的情况下，
   * type 仍是 'picgo-cloud'）不影响。本地图床 / 第三方图床的图片透传 `<img>`。
   */
  type?: string
}

const UNAVAILABLE_SVG_URL = getRendererStaticFileUrl(PICGO_CLOUD_IMAGE_UNAVAILABLE_SVG_FILENAME)

/**
 * 解析 PicGo Cloud 图片的最终展示地址。
 * - phase ∈ {frozen, pending_cleanup} 直接返回占位 SVG（避免远端 503 / 破图）。
 * - 仅在 type === PICGO_CLOUD_UPLOADER_TYPE 时生效；其他图床直接透传。
 * - 通过 onError 监听到加载失败时同样回落到占位 SVG（覆盖自定义域名失效等场景）。
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
  const isLoadFailed = isPicGoCloud && failedSrc !== undefined && failedSrc === originalSrc
  const usePlaceholder = isBlocked || isLoadFailed
  return {
    src: usePlaceholder ? UNAVAILABLE_SVG_URL : originalSrc,
    onError: () => {
      if (isPicGoCloud && !usePlaceholder) {
        setFailedSrc(originalSrc)
      }
    }
  }
}

/**
 * 包装 `<img>`，在 PicGo Cloud lifecycle 处于 frozen / pending_cleanup
 * 时把图片 src 替换为本地占位 SVG，避免远端 503 / 破图。
 * - 仍渲染原生 `<img>`，调用方（卡片 / preview / inspect 等）样式无需改动；
 * - onError 同样回落到占位 SVG，覆盖临时网络异常或自定义域名失效场景；
 * - 续费入口由 lifecycle banner 提供，本组件不再渲染 CTA。
 */
export function CloudImage ({ type, ...imgProps }: CloudImageProps) {
  const { src, onError } = useCloudImageSrc(type, imgProps.src)
  return (
    <img
      {...imgProps}
      src={src}
      onError={(event) => {
        onError(event)
        imgProps.onError?.(event)
      }}
    />
  )
}
