/**
 * Server-renders public marketing routes to HTML during the production
 * build. The client bundle still hydrates by replacing #root; crawlers that
 * do not run JavaScript see the H1 and body copy in the first response.
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CookieConsentBanner from '../components/CookieConsentBanner';
import EnvironmentGate from '../components/EnvironmentGate';
import Layout from '../components/Layout';
import { featureDemoRoutes } from '../data/featureDemos';
import { personaPages } from '../data/personas';
import FeatureDemo from '../pages/FeatureDemo';
import Help from '../pages/Help';
import Instructions from '../pages/Instructions';
import Landing from '../pages/Landing';
import PersonaPage from '../pages/PersonaPage';
import Privacy from '../pages/Privacy';
import ProductTour from '../pages/ProductTour';
import SubscriptionPage from '../pages/SubscriptionPage';
import Support from '../pages/Support';
import Terms from '../pages/Terms';
import { AuthProvider, useAuth } from '../shared/AuthContext';
import { appEnvironment } from '../shared/environment';
import { ThemeProvider } from '../shared/ThemeContext';

function PublicLanding() {
  const { user, loading } = useAuth();
  if (!loading && user && !user.isAnonymous) {
    return null;
  }
  return <Landing />;
}

function MarketingRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/" element={<Layout />}>
        {featureDemoRoutes.map(demo => (
          <Route
            key={demo.path}
            path={demo.path.replace(/^\//, '')}
            element={
              <FeatureDemo
                path={demo.path}
                title={demo.title}
                subtitle={demo.subtitle}
                marketingBullets={demo.marketingBullets}
                appRoute={demo.appRoute}
                appCtaLabel={demo.appCtaLabel}
              />
            }
          />
        ))}
        <Route path="instructions" element={<Instructions />} />
        <Route path="getting-started" element={<Instructions />} />
        <Route path="help" element={<Help />} />
        <Route path="product-tour" element={<ProductTour />} />
        <Route path="support" element={<Support />} />
        <Route path="contact" element={<Support />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="personas/:personaId" element={<PersonaPage />} />
      </Route>
    </Routes>
  );
}

export const MARKETING_PRERENDER_PATHS = [
  '/',
  ...featureDemoRoutes.map(demo => demo.path),
  '/instructions',
  '/getting-started',
  '/help',
  '/product-tour',
  '/support',
  '/contact',
  '/privacy',
  '/terms',
  '/subscription',
  ...personaPages.map(persona => persona.path),
];

export async function renderMarketingHtml(url: string): Promise<string> {
  if (import.meta.env.VITE_SHOW_COMING_SOON === 'true') {
    const { default: ComingSoon } = await import('../pages/ComingSoon');
    return renderToString(
      <MemoryRouter initialEntries={[url]}>
        <ComingSoon />
      </MemoryRouter>
    );
  }

  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <ThemeProvider>
          <EnvironmentGate environment={appEnvironment}>
            <CookieConsentBanner />
            <MarketingRoutes />
          </EnvironmentGate>
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}
