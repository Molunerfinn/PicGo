/// <reference types="vite/client" />

declare module "*.yml?raw" {
  const content: string
  export default content
}

declare module "*.yaml?raw" {
  const content: string
  export default content
}
