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

vi.mock('../src/shared/useAppOffline', () => ({
  useAppOffline: () => false,
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
    const desktopNav = header.querySelector('.hidden.min-w-0');

    expect(
      within(desktopNav).getByRole('link', { name: /Getting Started/i })
    ).toHaveAttribute('href', '/getting-started');
    expect(
      within(desktopNav).getByRole('link', { name: /Product Tour/i })
    ).toHaveAttribute('href', '/product-tour');
    expect(
      within(desktopNav).getByRole('link', { name: /^Plans$/i })
    ).toHaveAttribute('href', '/subscription');

    const useCasesButton = within(desktopNav).getByRole('button', {
      name: /Use cases/i,
    });
    expect(useCasesButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(useCasesButton);

    expect(
      within(header).getAllByRole('link', { name: /Ownership Records/i })[0]
    ).toHaveAttribute('href', '/personas/owners');
    expect(
      within(header).getAllByRole('link', { name: /Household Vehicles/i })[0]
    ).toHaveAttribute('href', '/personas/households');
    expect(
      within(header).getAllByRole('link', { name: /Guided Setup/i })[0]
    ).toHaveAttribute('href', '/personas/new-drivers');
    expect(
      within(header).getAllByRole('link', { name: /Hands-On Maintenance/i })[0]
    ).toHaveAttribute('href', '/personas/diy-maintainers');
    expect(
      within(header).getAllByRole('link', { name: /Work Vehicles/i })[0]
    ).toHaveAttribute('href', '/personas/light-fleets');
    expect(
      within(header).queryByRole('link', { name: /Pricing/i })
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
      within(header).getAllByRole('link', { name: /Login \/ Sign Up/i }).length
    ).toBeGreaterThan(0);
    expect(useCasesButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows application navigation and sign-out action while logged in', () => {
    authState.user = { uid: 'user-1', isAnonymous: false };

    renderHeader();

    const header = screen.getByRole('banner');
    const desktopNav = header.querySelector('.hidden.min-w-0');
    const gettingStartedLink = within(desktopNav).getByRole('link', {
      name: /Getting Started/i,
    });
    const garageLink = within(desktopNav).getByRole('link', {
      name: /^Garage$/i,
    });

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
      within(desktopNav).getByRole('link', { name: /Product Tour/i })
    ).toHaveAttribute('href', '/product-tour');

    expect(garageLink).toHaveAttribute('href', '/app');
    expect(gettingStartedLink).toHaveAttribute('href', '/getting-started');
    expect(
      within(desktopNav).getByRole('link', { name: /^Account$/i })
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole('link', { name: /^Service History$/i })
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole('link', { name: /^Maintenance Plan$/i })
    ).toBeInTheDocument();

    // Getting Started should appear before app workspace links.
    expect(
      gettingStartedLink.compareDocumentPosition(garageLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeGreaterThan(0);

    const signOutButton = within(desktopNav).getByRole('button', {
      name: /Sign Out/i,
    });

    fireEvent.click(signOutButton);
    expect(authState.signOut).toHaveBeenCalledTimes(1);
  });

  it('pairs Getting Started with Product Tour ahead of the capability links, with Account last', () => {
    authState.user = { uid: 'user-1', isAnonymous: false };

    renderHeader();

    const header = screen.getByRole('banner');
    const desktopNav = header.querySelector('.hidden.min-w-0');
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
      within(desktopNav).getByRole('link', {
        name: new RegExp(`^${name}$`, 'i'),
      })
    );

    for (let i = 0; i < links.length - 1; i += 1) {
      expect(
        links[i].compareDocumentPosition(links[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeGreaterThan(0);
    }

    expect(desktopNav).toHaveClass('lg:flex');
  });
});
