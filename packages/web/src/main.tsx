import { createRoot } from 'react-dom/client';
import App from './App';
import './components.css';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function initializeGoogleTag() {
  const runtimeEnvironment = String(import.meta.env.VITE_ENVIRONMENT || '')
    .trim()
    .toLowerCase();
  const isProductionRuntime =
    import.meta.env.PROD || runtimeEnvironment === 'production';
  const tagId = String(import.meta.env.VITE_GTM_ID || '').trim();

  if (!isProductionRuntime || !tagId) {
    return;
  }

  const isGtmContainerId = /^GTM-[A-Z0-9]+$/i.test(tagId);
  const isGaMeasurementId = /^G-[A-Z0-9]+$/i.test(tagId);

  if (!isGtmContainerId && !isGaMeasurementId) {
    console.warn(
      '[Google Tag] Invalid ID in VITE_GTM_ID. Expected GTM-XXXXXXX or G-XXXXXXXXXX.'
    );
    return;
  }

  if (isGtmContainerId) {
    if (document.getElementById('gtm-script')) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(tagId)}`;

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    if (!document.getElementById('gtm-noscript')) {
      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript';

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(tagId)}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');

      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }

    return;
  }

  if (document.getElementById('gtag-script')) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', tagId);

  const script = document.createElement('script');
  script.id = 'gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

initializeGoogleTag();

const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
