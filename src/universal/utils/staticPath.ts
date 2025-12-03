import path from 'path'

const staticBasePath = process.env.STATIC_PATH || path.join(process.cwd(), 'public')

export const getStaticPath = (...segments: string[]) => path.join(staticBasePath, ...segments)
