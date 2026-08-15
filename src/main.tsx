import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Season2App from './Season2App'
import { legacyReferenceRequested } from './product'

async function start() {
  const RootApp = import.meta.env.DEV && legacyReferenceRequested(window.location.search, true)
    ? (await import('./App')).default
    : Season2App

  createRoot(document.getElementById('root')!).render(<StrictMode><RootApp /></StrictMode>)
}

void start()
