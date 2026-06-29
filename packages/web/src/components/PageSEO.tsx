/**
 * PageSEO — imperatively updates <head> metadata for each route.
 *
 * Usage: render <PageSEO meta={...} /> at the top of any page component.
 * It sets document.title, meta description, canonical link, Open Graph tags,
 * Twitter Card tags, and optionally injects JSON-LD structured data.
 *
 * Runs in useEffect so it fires after mount and re-runs when meta changes.
 * Falls back gracefully when running outside a browser (SSR stubs).
 */

import { useEffect } from 'react';
import type { SeoMeta } from '../shared/seoMeta';
import { SITE_NAME } from '../shared/seoMeta';

// ─── Helper: get-or-create a <meta> element ───────────────────────────────────

function setMetaByName(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string): void {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const JSON_LD_ATTR = 'data-vv-jsonld';

function injectJsonLd(schemas: object[]): void {
  // Remove any previously injected JSON-LD scripts from this component
  document.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach(s => s.remove());

  for (const schema of schemas) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute(JSON_LD_ATTR, '');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PageSEOProps {
  meta: SeoMeta;
}

export default function PageSEO({ meta }: PageSEOProps) {
  useEffect(() => {
    const ogTitle = meta.ogTitle ?? meta.title;
    const ogDescription = meta.ogDescription ?? meta.description;
    const twitterCard = meta.twitterCard ?? 'summary_large_image';

    document.title = meta.title;

    // Standard meta
    setMetaByName('description', meta.description);

    // Canonical
    setCanonical(meta.canonical);

    // Open Graph
    setMetaByProperty('og:title', ogTitle);
    setMetaByProperty('og:description', ogDescription);
    setMetaByProperty('og:url', meta.canonical);
    setMetaByProperty('og:type', meta.ogType ?? 'website');
    setMetaByProperty('og:site_name', SITE_NAME);
    if (meta.ogImage) {
      setMetaByProperty('og:image', meta.ogImage);
    }

    // Twitter Card
    setMetaByName('twitter:card', twitterCard);
    setMetaByName('twitter:title', ogTitle);
    setMetaByName('twitter:description', ogDescription);
    setMetaByName('twitter:site', '@vehiclevitals');
    if (meta.ogImage) {
      setMetaByName('twitter:image', meta.ogImage);
    }

    // JSON-LD structured data
    if (meta.jsonLd) {
      const schemas = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
      injectJsonLd(schemas);
    } else {
      // Clean up any schemas from a previous route
      document.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach(s => s.remove());
    }
  }, [meta]);

  return null;
}
