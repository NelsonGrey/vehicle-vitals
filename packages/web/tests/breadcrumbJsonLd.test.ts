import { describe, expect, it } from 'vitest';
import { personaPages } from '../src/data/personas';
import { APP_URL, ROUTE_SEO, getPersonaSeoMeta } from '../src/shared/seoMeta';

interface ListItem {
  '@type': string;
  position: number;
  name: string;
  item: string;
}

interface BreadcrumbList {
  '@type': string;
  itemListElement: ListItem[];
}

function schemasOf(jsonLd: object | object[] | undefined): object[] {
  if (!jsonLd) return [];
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
}

function breadcrumbOf(jsonLd: object | object[] | undefined): BreadcrumbList {
  const match = schemasOf(jsonLd).find(
    schema => (schema as { '@type'?: string })['@type'] === 'BreadcrumbList'
  );
  expect(match, 'expected a BreadcrumbList schema').toBeTruthy();
  return match as BreadcrumbList;
}

function expectTrail(
  jsonLd: object | object[] | undefined,
  names: string[],
  paths: string[]
) {
  const list = breadcrumbOf(jsonLd);
  expect(list.itemListElement.map(item => item.name)).toEqual(names);
  expect(list.itemListElement.map(item => item.position)).toEqual(
    names.map((_, index) => index + 1)
  );
  expect(list.itemListElement.map(item => item.item)).toEqual(
    paths.map(path => `${APP_URL}${path}`)
  );
  for (const item of list.itemListElement) {
    expect(item['@type']).toBe('ListItem');
    expect(item.item.startsWith('https://')).toBe(true);
  }
}

describe('BreadcrumbList JSON-LD', () => {
  it('leaves the homepage without a breadcrumb trail', () => {
    const types = schemasOf(ROUTE_SEO['/'].jsonLd).map(
      schema => (schema as { '@type'?: string })['@type']
    );
    expect(types).not.toContain('BreadcrumbList');
  });

  it.each([
    ['/getting-started', 'Getting Started', '/getting-started'],
    ['/product-tour', 'Product Tour', '/product-tour'],
    ['/subscription', 'Plans & Pricing', '/subscription'],
    ['/support', 'Support', '/support'],
    ['/privacy', 'Privacy Policy', '/privacy'],
    ['/terms', 'Terms of Use', '/terms'],
  ])('adds a Home > page trail on %s', (route, name, path) => {
    expectTrail(ROUTE_SEO[route].jsonLd, ['Home', name], ['/', path]);
  });

  it('keeps the subscription Product schema next to the breadcrumb', () => {
    const types = schemasOf(ROUTE_SEO['/subscription'].jsonLd).map(
      schema => (schema as { '@type'?: string })['@type']
    );
    expect(types).toEqual(['Product', 'BreadcrumbList']);
  });

  it('points legacy aliases at the canonical page', () => {
    expectTrail(
      ROUTE_SEO['/instructions'].jsonLd,
      ['Home', 'Getting Started'],
      ['/', '/getting-started']
    );
    expectTrail(ROUTE_SEO['/contact'].jsonLd, ['Home', 'Support'], [
      '/',
      '/support',
    ]);
  });

  it('nests each persona page as Home > Personas > page', () => {
    for (const persona of personaPages) {
      const meta = getPersonaSeoMeta(persona.id);
      expectTrail(
        meta.jsonLd,
        ['Home', 'Personas', persona.navLabel],
        ['/', '/#personas', persona.path]
      );
      const types = schemasOf(meta.jsonLd).map(
        schema => (schema as { '@type'?: string })['@type']
      );
      expect(types).toContain('WebPage');
    }
  });
});
