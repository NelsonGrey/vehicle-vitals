import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

console.log('main.tsx loaded - starting React app');

const container = document.getElementById('root')
if (!container) {
  console.error('Root element not found!');
  throw new Error('Root element not found')
}

console.log('Root element found, creating React root');

const root = createRoot(container)

console.log('Rendering React app');

root.render(<App />)

console.log('React app rendered');