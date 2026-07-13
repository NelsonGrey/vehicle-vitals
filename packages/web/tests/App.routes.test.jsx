import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

// App.tsx bakes in its own <BrowserRouter> and a deep provider tree (auth,
// Firebase, lazy-loaded pages), so rendering it end-to-end in a unit test
// would mean mocking most of the app's runtime dependencies just to check
// a handful of one-line <Navigate replace /> routes. Instead, this asserts
// directly against the route table's source: a regression-proofing check
// that canonical destinations and legacy redirects stay wired the way this
// refactor left them, without the fragility of a full app render. Redirect
// *behavior* (that visiting the legacy path lands on the canonical page's
// content) is covered by packages/web/tests/uat.spec.ts's Playwright suite.

const appSource = readFileSync(
  resolve(__dirname, '../src/App.tsx'),
  'utf8'
);

function expectRedirect(fromPath, toPath) {
  const pattern = new RegExp(
    `path="${fromPath}"[\\s\\S]{0,80}?element=\\{<Navigate to="${toPath}" replace`
  );
  expect(
    pattern.test(appSource),
    `expected a replace-redirect from "${fromPath}" to "${toPath}"`
  ).toBe(true);
}

describe('App.tsx route table', () => {
  it('redirects legacy consolidated marketing pages to their canonical destinations', () => {
    expectRedirect('start-steps', '/getting-started');
    expectRedirect('everyday-screens', '/product-tour');
    expectRedirect('short-video-tours', '/product-tour');
  });

  it('still redirects pre-existing legacy app paths to their /app destinations', () => {
    expectRedirect('add-vehicle', '/app/add-vehicle');
    expectRedirect('providers', '/app/providers');
    expectRedirect('profile', '/app/profile');
    expectRedirect('timeline', '/app/timeline');
    expectRedirect('upcoming', '/app/upcoming');
  });

  it('renders the canonical Getting Started and Product Tour routes directly (not via redirect)', () => {
    expect(appSource).toMatch(
      /path="getting-started"\s+element=\{<Instructions/
    );
    expect(appSource).toMatch(/path="product-tour"\s+element=\{<ProductTour/);
  });

  it('no longer imports the deleted StartSteps/EverydayScreens/ShortVideoTours page components', () => {
    expect(appSource).not.toMatch(/from '\.\/pages\/StartSteps'/);
    expect(appSource).not.toMatch(/from '\.\/pages\/EverydayScreens'/);
    expect(appSource).not.toMatch(/from '\.\/pages\/ShortVideoTours'/);
  });
});
