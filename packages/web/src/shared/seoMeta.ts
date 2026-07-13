/**
 * Per-route SEO metadata.
 *
 * The canonical base URL is read from VITE_APP_URL at build time and falls
 * back to the production domain. Persona pages are resolved dynamically in
 * PageSEO.tsx because their paths include the persona ID.
 */

import { personaPages } from '../data/personas';

// Set VITE_APP_URL=https://vehicle-vitals.com in your production .env
const APP_URL = (import.meta.env.VITE_APP_URL || 'https://vehicle-vitals.com').replace(/\/$/, '');

const SITE_NAME = 'Vehicle Vitals';

const DEFAULT_OG_IMAGE = `${APP_URL}/android-chrome-512x512.png`;

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: object | object[];
}

// ─── Shared JSON-LD schemas ───────────────────────────────────────────────────

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: APP_URL,
  logo: DEFAULT_OG_IMAGE,
  sameAs: [
    'https://x.com/vehiclevitals',
    'https://instagram.com/vehiclevitals',
    'https://youtube.com/@vehiclevitals',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: APP_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${APP_URL}/help?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web, iOS',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '2.99',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
    },
    {
      '@type': 'Offer',
      name: 'Premium',
      price: '6.99',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
    },
  ],
};

// ─── Static route metadata ────────────────────────────────────────────────────

export const ROUTE_SEO: Record<string, SeoMeta> = {
  '/': {
    title: `${SITE_NAME} — One garage for every vehicle record, reminder, and repair cost`,
    description:
      'Track maintenance history, stay ahead of upcoming service, and keep proof of ownership ready. Free to start — scales from one vehicle to household fleets.',
    canonical: `${APP_URL}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: [organizationSchema, websiteSchema, softwareAppSchema],
  },

  '/subscription': {
    title: `Plans & Pricing — ${SITE_NAME}`,
    description:
      'Free, Pro ($2.99/mo), Premium ($6.99/mo), and Enterprise plans. From core record-keeping to fleet-level operations — find the plan that fits your garage.',
    canonical: `${APP_URL}/subscription`,
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: SITE_NAME,
      description: 'Vehicle maintenance tracking and record management',
      offers: softwareAppSchema.offers,
    },
  },

  '/getting-started': {
    title: `Getting Started — ${SITE_NAME}`,
    description:
      'Start in three simple steps: add your vehicle, track service and costs, stay on top of what\'s next. See how Vehicle Vitals turns scattered receipts into a trusted ownership record.',
    canonical: `${APP_URL}/getting-started`,
    ogType: 'website',
  },

  '/everyday-screens': {
    title: `Product Screens — ${SITE_NAME}`,
    description:
      'A look at the Vehicle Vitals garage, timeline, upcoming tasks, and records screens. See what the app looks like before you sign up.',
    canonical: `${APP_URL}/everyday-screens`,
    ogType: 'website',
  },

  '/short-video-tours': {
    title: `Product Tours — ${SITE_NAME}`,
    description:
      'Short video walkthroughs of Vehicle Vitals features: VIN lookup, maintenance planning, ownership history, and cross-platform access.',
    canonical: `${APP_URL}/short-video-tours`,
    ogType: 'website',
  },

  '/help': {
    title: `Help Center — ${SITE_NAME}`,
    description:
      'Answers to common questions about Vehicle Vitals: adding vehicles, logging records, managing reminders, exporting data, and account settings.',
    canonical: `${APP_URL}/help`,
    ogType: 'website',
  },

  '/support': {
    title: `Support — ${SITE_NAME}`,
    description: 'Get help with Vehicle Vitals. Contact our support team for questions, billing, or technical issues.',
    canonical: `${APP_URL}/support`,
    ogType: 'website',
  },

  // Legacy URL — canonical still points at /support so search engines
  // converge on the new path.
  '/contact': {
    title: `Support — ${SITE_NAME}`,
    description: 'Get help with Vehicle Vitals. Contact our support team for questions, billing, or technical issues.',
    canonical: `${APP_URL}/support`,
    ogType: 'website',
  },

  '/privacy': {
    title: `Privacy Policy — ${SITE_NAME}`,
    description: 'How Vehicle Vitals collects, uses, and protects your data.',
    canonical: `${APP_URL}/privacy`,
    ogType: 'website',
  },

  '/terms': {
    title: `Terms of Service — ${SITE_NAME}`,
    description: 'Terms and conditions for using Vehicle Vitals.',
    canonical: `${APP_URL}/terms`,
    ogType: 'website',
  },
};

// ─── Dynamic persona metadata ─────────────────────────────────────────────────

const personaDescriptions: Record<string, string> = {
  owners:
    'Keep every service record ready when it matters. Track history, stay on top of what is due, and keep credible proof ready for resale, warranty, or insurance.',
  households:
    'Coordinate every vehicle in one shared garage. Manage upcoming work, share records, and keep everyone aligned without the text threads.',
  'new-drivers':
    'Know what to track from day one. Capture each service, learn what matters, and start good ownership habits with plain-language guidance.',
  'diy-maintainers':
    'Document the work you do yourself. Tie parts, costs, and labor notes to each job so self-performed maintenance still builds vehicle value.',
  'light-fleets':
    'Keep business vehicles ready, documented, and accountable. Track maintenance readiness, costs, and vendor context across your work vehicles.',
};

export function getPersonaSeoMeta(personaId: string): SeoMeta {
  const persona = personaPages.find(p => p.id === personaId);
  if (!persona) {
    return ROUTE_SEO['/'];
  }

  const description =
    personaDescriptions[personaId] ??
    `${persona.headline} — ${SITE_NAME}`;

  return {
    title: `${persona.title} — ${SITE_NAME}`,
    description,
    canonical: `${APP_URL}${persona.path}`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: persona.title,
      description,
      url: `${APP_URL}${persona.path}`,
    },
  };
}

export { APP_URL, SITE_NAME };
