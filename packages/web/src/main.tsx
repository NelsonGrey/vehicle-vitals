import { createRoot } from 'react-dom/client';
import App from './App';
import './components.css';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

console.log('main.tsx loaded - starting React app');

const container = document.getElementById('root');
if (!container) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

console.log('Root element found, creating React root');

const root = createRoot(container);

console.log('Rendering React app');

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

console.log('React app rendered');
