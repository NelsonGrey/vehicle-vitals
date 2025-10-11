import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Dev-only: auto anonymous sign-in to enable local Firestore writes
// Import conditionally to avoid build-time resolution issues
if (import.meta.env.DEV) {
  import('./shared/devAuth').catch(() => {
    console.debug('devAuth not available');
  });
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
