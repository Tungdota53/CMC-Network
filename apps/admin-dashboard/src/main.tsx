import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './modern.css'
import ModernAdmin from './ModernAdmin.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModernAdmin />
  </StrictMode>,
)
