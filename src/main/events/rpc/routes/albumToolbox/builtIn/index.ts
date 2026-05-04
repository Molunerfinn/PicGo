import { albumMenu as changeURLAlbumMenu } from './changeURL'
export const builtInAlbumToolboxMenu = () => {
  const menuList = [...changeURLAlbumMenu()]

  return menuList
}
