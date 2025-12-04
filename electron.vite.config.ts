import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
// temp for webUtils
import electronRenderer from '@molunerfinn/vite-plugin-electron-renderer'
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
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/background.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    publicDir: resolve(__dirname, 'src/renderer/public'),
    resolve: { alias },
    plugins: [vue(), electronRenderer()],
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    },
    server: {
      port: 5173
    }
  }
})
