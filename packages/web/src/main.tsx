import { createRoot } from 'react-dom/client';
import App from './App';
import './components.css';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

// Self-hosted (CSP font-src is 'self' only, no fonts.gstatic.com) weights
// backing the Tailwind `sans`/`serif` families -- these were previously
// declared in tailwind.config but never actually loaded, silently falling
// back to system fonts everywhere.
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-700.css';

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
