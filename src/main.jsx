import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
const isCardsApp = /^\/cartoes(?:\/|$)/.test(window.location.pathname)
// Keep each import in its own loader so production preloading includes that app's CSS.
const CardsApp = lazy(() => import('./cards/CardsApp.jsx'))
const MenuApp = lazy(() => import('./App.jsx'))
const App = isCardsApp ? CardsApp : MenuApp
createRoot(document.getElementById('root')).render(
  <StrictMode><Suspense fallback={<div role="status" style={{ padding: 32 }}>Carregando TOKKA…</div>}><App /></Suspense></StrictMode>,
)
