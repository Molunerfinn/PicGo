import { type ImgHTMLAttributes } from 'react'
import { useCloudImageSrc } from '@/hooks/use-cloud-image-src'

type ImgProps = ImgHTMLAttributes<HTMLImageElement>

interface CloudImageProps extends Omit<ImgProps, 'type'> {
  /**
   * 图片对应的图床 type（来自 ImgInfo.type）。当 type === 'picgo-cloud' 时启用
   * lifecycle 占位保护——其他图床（包括用户自定义域名走 PicGo Cloud 的情况下，
   * type 仍是 'picgo-cloud'）不影响。本地图床 / 第三方图床的图片透传 `<img>`。
   */
  type?: string
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
