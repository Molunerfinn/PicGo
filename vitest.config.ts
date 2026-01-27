import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const alias = {
  '@': resolve(__dirname, 'src/renderer'),
  '~': resolve(__dirname, 'src'),
  '#': resolve(__dirname, 'src/universal'),
  root: resolve(__dirname, '.'),
  apis: resolve(__dirname, 'src/main/apis'),
  '@core': resolve(__dirname, 'src/main/apis/core')
}

export default defineConfig({
  resolve: { alias },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.spec.ts']
  }
})

