#!/usr/bin/env node
/**
 * Post-build step: bakes real per-route <title>/description/canonical/
 * Open Graph/Twitter Card/JSON-LD tags into static HTML files in dist/,
 * so link-preview and search-engine crawlers that don't execute JavaScript
 * (Facebook, X/Twitter, LinkedIn, Slack, Discord, iMessage, WhatsApp, and
 * some SEO tools) see the real per-page metadata instead of the single
 * generic <title>/description in index.html.
 *
 * Without this, PageSEO.tsx's useEffect only ever updates the DOM after
 * React mounts -- fine for Googlebot's second rendering pass, invisible to
 * every crawler that only reads the raw HTML response.
 *
 * How it works: builds src/shared/seoMeta.ts and src/data/personas.ts as
 * small SSR-format ES modules (via Vite's own build() API, so
 * import.meta.env.VITE_APP_URL resolves exactly as it does in the real app
 * build for this mode), imports the compiled route metadata, then writes
 * one static HTML file per route into dist/ as a modified copy of the
 * already-built dist/index.html (same hashed asset references, so the SPA
 * still boots and hydrates identically once a crawler's initial HTML parse
 * is done).
 *
 * Output paths are flat (dist/subscription.html, dist/personas/owners.html)
 * to match Firebase Hosting's `cleanUrls` rewriting of `/subscription` ->
 * `/subscription.html`. Requires `cleanUrls: true` in firebase*.json.
 */

import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || 'production';
const distDir = path.join(root, 'dist');
const tmpDir = path.join(root, '.seo-prerender-tmp');

async function buildSsrModule(entry, outFile) {
  await build({
    root,
    mode,
    configFile: path.join(root, 'vite.config.js'),
    logLevel: 'warn',
    build: {
      ssr: entry,
      outDir: tmpDir,
      emptyOutDir: false,
      write: true,
      minify: false,
      rollupOptions: {
        output: { format: 'es', entryFileNames: outFile },
      },
    },
  });
  const mod = await import(
    `${path.join(tmpDir, outFile)}?t=${Date.now()}`
  );
  return mod;
}

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
    ...schemas.map(
      schema =>
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    ),
  ];

  return tags.join('\n    ');
}

function applyMetaToHtml(template, meta) {
  let html = template;

  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`
  );

  html = html.replace('</head>', `    ${renderHead(meta)}\n  </head>`);

  return html;
}

function routeToOutputPath(routePath) {
  if (routePath === '/') return path.join(distDir, 'index.html');
  const trimmed = routePath.replace(/^\/+/, '');
  return path.join(distDir, `${trimmed}.html`);
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`[prerender-seo] dist/ not found at ${distDir} -- run vite build first.`);
    process.exit(1);
  }

  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const seoModule = await buildSsrModule(
      path.join(root, 'src/shared/seoMeta.ts'),
      'seoMeta.mjs'
    );
    const personasModule = await buildSsrModule(
      path.join(root, 'src/data/personas.ts'),
      'personas.mjs'
    );

    global.__SITE_NAME__ = seoModule.SITE_NAME;
    global.__DEFAULT_OG_IMAGE__ = seoModule.DEFAULT_OG_IMAGE;

    const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

    let written = 0;

    for (const [routePath, meta] of Object.entries(seoModule.ROUTE_SEO)) {
      const outPath = routeToOutputPath(routePath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, applyMetaToHtml(template, meta));
      written += 1;
    }

    for (const persona of personasModule.personaPages) {
      const meta = seoModule.getPersonaSeoMeta(persona.id);
      const outPath = routeToOutputPath(persona.path);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, applyMetaToHtml(template, meta));
      written += 1;
    }

    console.log(`[prerender-seo] wrote ${written} static HTML files with real per-route meta tags.`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error('[prerender-seo] failed:', err);
  process.exit(1);
});
