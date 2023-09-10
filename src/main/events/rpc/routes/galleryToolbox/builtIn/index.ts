import { galleryMenu as changeHostGalleryMenu } from './changeHost'
export const builtInGalleryToolboxMenu = () => {
  const menuList = [...changeHostGalleryMenu()]

  return menuList
}
