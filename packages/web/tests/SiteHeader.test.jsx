import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SiteHeader from '../src/components/SiteHeader';

const authState = {
  user: null,
  signOut: vi.fn(),
  supportAccess: null,
};

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../src/shared/environment', () => ({
  isDemonstrationEnvironment: false,
}));

vi.mock('../src/shared/marketingAnalytics', () => ({
  trackHeaderNavClick: vi.fn(),
}));

vi.mock('../src/components/StackedVLogo', () => ({
  default: () => <div data-testid="stacked-logo">Vehicle-Vitals</div>,
}));

function renderHeader() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SiteHeader />
    </MemoryRouter>
  );
}

describe('SiteHeader', () => {
  beforeEach(() => {
    authState.user = null;
    authState.supportAccess = null;
    authState.signOut = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows marketing navigation and login link while logged out', () => {
    renderHeader();

    const header = screen.getByRole('banner');
    const ownersLink = within(header).getByRole('link', {
      name: /Ownership Records/i,
    });

    expect(ownersLink).toBeVisible();
    expect(ownersLink).toHaveAttribute('href', '/personas/owners');
    expect(
      within(header).getByRole('link', { name: /Shared Garage/i })
    ).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /Guided Setup/i })
    ).toHaveAttribute('href', '/personas/new-drivers');
    expect(
      within(header).getByRole('link', { name: /Hands-On Maintenance/i })
    ).toHaveAttribute('href', '/personas/diy-maintainers');
    expect(
      within(header).getByRole('link', { name: /Work Vehicles/i })
    ).toHaveAttribute('href', '/personas/light-fleets');
    expect(
      within(header).queryByRole('link', { name: /Pricing/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Product Tour/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Subscriptions/i })
    ).not.toBeInTheDocument();

    expect(
      within(header).queryByRole('link', { name: /^Garage$/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /^Home$/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('button', { name: /Sign Out/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /VIN Lookup/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Cross Platform/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Product Overview/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Help & How-To/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Getting Started/i })
    ).not.toBeInTheDocument();

    expect(
      within(header).getByRole('link', { name: /Login \/ Sign Up/i })
    ).toBeVisible();
  });

  it('shows application navigation and sign-out action while logged in', () => {
    authState.user = { uid: 'user-1', isAnonymous: false };

    renderHeader();

    const header = screen.getByRole('banner');
    const gettingStartedLink = within(header).getByRole('link', {
      name: /Getting Started/i,
    });
    const garageLink = within(header).getByRole('link', { name: /^Garage$/i });

    expect(
      within(header).queryByRole('link', { name: /^Home$/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /VIN Lookup/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Pricing/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Product Overview/i })
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole('link', { name: /Help & How-To/i })
    ).not.toBeInTheDocument();

    // Product Tour is marketing content, not a capability, but stays
    // available for continuity once signed in.
    expect(
      within(header).getByRole('link', { name: /Product Tour/i })
    ).toHaveAttribute('href', '/product-tour');

    expect(garageLink).toBeVisible();
    expect(gettingStartedLink).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /^Account$/i })
    ).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /^Service History$/i })
    ).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /^Maintenance Plan$/i })
    ).toBeVisible();

    // Getting Started should appear before app workspace links.
    expect(
      gettingStartedLink.compareDocumentPosition(garageLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeGreaterThan(0);

    const signOutButton = within(header).getByRole('button', {
      name: /Sign Out/i,
    });
    expect(signOutButton).toBeVisible();

    fireEvent.click(signOutButton);
    expect(authState.signOut).toHaveBeenCalledTimes(1);
  });

  it('pairs Getting Started with Product Tour ahead of the capability links, with Account last', () => {
    authState.user = { uid: 'user-1', isAnonymous: false };

    renderHeader();

    const header = screen.getByRole('banner');
    const expectedOrder = [
      'Getting Started',
      'Product Tour',
      'Garage',
      'Service History',
      'Maintenance Plan',
      'Shops & Services',
      'Account',
    ];
    const links = expectedOrder.map(name =>
      within(header).getByRole('link', {
        name: new RegExp(`^${name}$`, 'i'),
      })
    );

    for (let i = 0; i < links.length - 1; i += 1) {
      expect(
        links[i].compareDocumentPosition(links[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeGreaterThan(0);
    }

    // The pair sits in its own margined wrapper so it reads as visually
    // separated from the capability links, without breaking the flex-wrap
    // layout the rest of the nav relies on at narrow widths.
    const gettingStartedLink = within(header).getByRole('link', {
      name: /^Getting Started$/i,
    });
    expect(gettingStartedLink.parentElement.className).toMatch(/mr-4/);
  });
});
