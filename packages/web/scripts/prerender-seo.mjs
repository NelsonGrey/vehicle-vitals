#!/usr/bin/env node
/**
 * Post-build step: writes one static HTML file per public marketing route.
 *
 * Each file keeps the built bundle's hashed asset tags and also contains:
 * - real per-route <title>/description/canonical/Open Graph/Twitter/JSON-LD
 * - the server-rendered H1 and body copy inside <div id="root">
 *
 * Crawlers that do not execute JavaScript therefore see the page, not an
 * empty shell. The client bundle still boots from the same script tags and
 * replaces #root once it runs.
 *
 * Output paths are flat (dist/subscription.html, dist/personas/owners.html)
 * to match Firebase Hosting's `cleanUrls` rewriting of `/subscription` ->
 * `/subscription.html`. Requires `cleanUrls: true` in firebase*.json.
 *
 * Firebase's catch-all must NOT rewrite every path to one shell. Unknown
 * paths fall through to dist/404.html (HTTP 404). /app and /auth keep a
 * neutral app-shell.html rewrite. That shell is copied from the generic
 * Vite index BEFORE the homepage metadata and body are applied.
 */

import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || 'production';
const distDir = path.join(root, 'dist');
const HERO_PRELOAD =
  '<link rel="preload" as="image" href="/images/hero-garage.webp" type="image/webp" fetchpriority="high" />';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHead(meta) {
  const ogTitle = meta.ogTitle ?? meta.title;
  const ogDescription = meta.ogDescription ?? meta.description;
  const twitterCard = meta.twitterCard ?? 'summary_large_image';
  const ogImage = meta.ogImage ?? global.__DEFAULT_OG_IMAGE__;
  const schemas = meta.jsonLd
    ? Array.isArray(meta.jsonLd)
      ? meta.jsonLd
      : [meta.jsonLd]
    : [];

  const tags = [
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType ?? 'website')}" />`,
    `<meta property="og:site_name" content="${escapeHtml(global.__SITE_NAME__)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta name="twitter:card" content="${escapeHtml(twitterCard)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta name="twitter:site" content="@vehiclevitalapp" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    // data-vv-jsonld matches the marker PageSEO.tsx's injectJsonLd() uses to
    // find and remove schemas on route change -- without it, hydration/
    // client-side navigation would leave this prerendered schema in the
    // document forever instead of replacing or clearing it.
    ...schemas.map(
      schema =>
        `<script type="application/ld+json" data-vv-jsonld>${JSON.stringify(schema)}</script>`
    ),
  ];

  return tags.join('\n    ');
}

function applyMetaToHtml(template, meta, bodyHtml, { preloadHero = false } = {}) {
  let html = template;

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  const headExtras = `${preloadHero ? `${HERO_PRELOAD}\n    ` : ''}${renderHead(meta)}`;
  html = html.replace('</head>', `    ${headExtras}\n  </head>`);

  if (bodyHtml) {
    if (!html.includes('<div id="root"></div>')) {
      throw new Error('Built index.html is missing <div id="root"></div>');
    }
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${bodyHtml}</div>`
    );
  }

  return html;
}

function visibleWordCount(html) {
  const body = html.split(/<body/i)[1] || html;
  const text = body
    // `\s*` before `>` so end tags like `</script >` are removed too.
    // This only counts words in our own build output; it is not a sanitizer.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return text.split(/\s+/).filter(word => /[A-Za-z0-9]/.test(word)).length;
}

function assertCrawlable(routePath, html) {
  const body = html.split(/<body/i)[1] || '';
  // Staging/dev environment gate and the coming-soon flag replace the
  // marketing page on purpose. Production must ship the real copy.
  const gated = /restricted .+ environment/i.test(body);
  const comingSoon = /coming soon/i.test(body);
  if (gated || comingSoon) {
    return;
  }
  if (!/<h1[\s>]/i.test(body)) {
    throw new Error(`[prerender-seo] ${routePath} body is missing an <h1>`);
  }
  const words = visibleWordCount(html);
  if (words < 40) {
    throw new Error(
      `[prerender-seo] ${routePath} body has only ${words} words; expected the rendered page.`
    );
  }
}

function routeToOutputPath(routePath) {
  if (routePath === '/') return path.join(distDir, 'index.html');
  const trimmed = routePath.replace(/^\/+/, '');
  return path.join(distDir, `${trimmed}.html`);
}

async function main() {
  process.env.NODE_ENV = 'production';
  if (!fs.existsSync(distDir)) {
    console.error(`[prerender-seo] dist/ not found at ${distDir} -- run vite build first.`);
    process.exit(1);
  }

  const vite = await createServer({
    root,
    mode,
    configFile: path.join(root, 'vite.config.js'),
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'warn',
    // Avoid crawling the shared package's Expo entry during this Node render.
    optimizeDeps: { noDiscovery: true, include: [] },
  });

  try {
    const seoModule = await vite.ssrLoadModule('/src/shared/seoMeta.ts');
    const personasModule = await vite.ssrLoadModule('/src/data/personas.ts');
    const renderer = await vite.ssrLoadModule(
      '/src/prerender/renderMarketingHtml.tsx'
    );

    global.__SITE_NAME__ = seoModule.SITE_NAME;
    global.__DEFAULT_OG_IMAGE__ = seoModule.DEFAULT_OG_IMAGE;

    const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

    // /app and /auth have no static file. Their rewrite target must stay
    // generic -- write it BEFORE index.html is overwritten with the
    // homepage's title, JSON-LD, and body. firebase*.json must point here,
    // not at /index.html.
    fs.writeFileSync(path.join(distDir, 'app-shell.html'), template);

    const renderedByPath = new Map();
    for (const routePath of renderer.MARKETING_PRERENDER_PATHS) {
      renderedByPath.set(routePath, await renderer.renderMarketingHtml(routePath));
    }

    let written = 0;

    for (const [routePath, meta] of Object.entries(seoModule.ROUTE_SEO)) {
      const bodyHtml = renderedByPath.get(routePath);
      if (!bodyHtml) {
        throw new Error(`[prerender-seo] no rendered body for ${routePath}`);
      }
      const html = applyMetaToHtml(template, meta, bodyHtml, {
        preloadHero: routePath === '/',
      });
      assertCrawlable(routePath, html);
      const outPath = routeToOutputPath(routePath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      written += 1;
    }

    for (const persona of personasModule.personaPages) {
      const meta = seoModule.getPersonaSeoMeta(persona.id);
      const bodyHtml = renderedByPath.get(persona.path);
      if (!bodyHtml) {
        throw new Error(`[prerender-seo] no rendered body for ${persona.path}`);
      }
      const html = applyMetaToHtml(template, meta, bodyHtml);
      assertCrawlable(persona.path, html);
      const outPath = routeToOutputPath(persona.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      written += 1;
    }

    console.log(
      `[prerender-seo] wrote ${written} static HTML files with per-route meta tags and body copy.`
    );
  } finally {
    await vite.close();
  }
}

main().catch(err => {
  console.error('[prerender-seo] failed:', err);
  process.exit(1);
});
