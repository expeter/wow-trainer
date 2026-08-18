import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Season2App from './Season2App'
import { OnlineProvider } from './platform/online/OnlineContext'

createRoot(document.getElementById('root')!).render(<StrictMode><OnlineProvider><Season2App /></OnlineProvider></StrictMode>)
