import { galleryMenu as changeURLGalleryMenu } from './changeURL'
export const builtInGalleryToolboxMenu = () => {
  const menuList = [...changeURLGalleryMenu()]

  return menuList
}
