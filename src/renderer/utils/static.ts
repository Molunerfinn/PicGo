export const getRendererStaticFileUrl = (fileName: string) => {
  return import.meta.env.BASE_URL + fileName
}
