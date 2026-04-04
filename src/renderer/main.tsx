import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeI18n } from './i18n'
import { webFrame } from './utils/bridge'
import './index.css'
import App from './App'

webFrame.setVisualZoomLevelLimits(1, 1)

async function bootstrap () {
  await initializeI18n()

  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Renderer root element not found')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap renderer', error)
})
