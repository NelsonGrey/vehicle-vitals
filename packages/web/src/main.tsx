import { createRoot } from 'react-dom/client';
import App from './App';
import './components.css';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

// GTM is loaded via the hardcoded snippet in index.html (GTM-5GHJHB5J).
// The dataLayer and gtag types are declared here for use by consent.ts and
// any code that pushes events directly.
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
