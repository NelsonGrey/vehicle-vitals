import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../../..');

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8'));
}

const hostingConfigs = [
  'firebase.prod.json',
  'firebase.staging.json',
  'firebase.dev.json',
];

describe('Firebase Hosting SEO', () => {
  it('returns real 404s for unknown paths and 301s for legacy marketing URLs', () => {
    for (const file of hostingConfigs) {
      const hosting = readJson(file).hosting;
      expect(hosting.cleanUrls).toBe(true);
      expect(hosting.trailingSlash).toBe(false);

      const rewriteSources = hosting.rewrites.map(
        (rule: { source: string }) => rule.source
      );
      expect(rewriteSources).not.toContain('**');
      expect(rewriteSources).toEqual(
        expect.arrayContaining(['/app', '/app/**', '/auth', '/auth/**'])
      );
      expect(
        hosting.rewrites.some(
          (rule: { source: string; function?: { functionId?: string } }) =>
            rule.source === '/api/webhooks/stripe' &&
            rule.function?.functionId === 'stripeSubscriptionWebhook'
        )
      ).toBe(true);

      const redirects = new Map(
        hosting.redirects.map(
          (rule: { source: string; destination: string; type: number }) => [
            rule.source,
            rule,
          ]
        )
      );
      expect(redirects.get('/start-steps')).toMatchObject({
        destination: '/getting-started',
        type: 301,
      });
      expect(redirects.get('/everyday-screens')).toMatchObject({
        destination: '/product-tour',
        type: 301,
      });
      expect(redirects.get('/short-video-tours')).toMatchObject({
        destination: '/product-tour',
        type: 301,
      });
    }
  });

  it('keeps robots.txt from blocking the app and auth trees', () => {
    const robots = readFileSync(
      resolve(repoRoot, 'packages/web/public/robots.txt'),
      'utf8'
    );
    expect(robots).toMatch(/Disallow:\s*\/app\//);
    expect(robots).toMatch(/Disallow:\s*\/auth\//);
  });

  it('lists the four homepage demo routes in the sitemap', () => {
    const sitemap = readFileSync(
      resolve(repoRoot, 'packages/web/public/sitemap.xml'),
      'utf8'
    );
    for (const path of [
      '/vin-lookup-demo',
      '/maintenance-planning-demo',
      '/ownership-history-demo',
      '/cross-platform-access-demo',
    ]) {
      expect(sitemap).toContain(`https://vehicle-vitals.com${path}`);
    }
  });

  it('ships a static 404 document that is not the homepage', () => {
    const page = readFileSync(
      resolve(repoRoot, 'packages/web/public/404.html'),
      'utf8'
    );
    expect(page).toContain('<h1>Page not found</h1>');
    expect(page).toContain('noindex');
    expect(page).not.toContain('rel="canonical"');
    expect(page).not.toContain('/src/main.tsx');
    expect(page).not.toContain('id="root"');
  });
});
