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

vi.mock('../src/components/StackedVLogo', () => ({
  default: () => <div data-testid="stacked-logo">Vehicle Vitals</div>,
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
    const gettingStartedLink = within(header).getByRole('link', {
      name: /Getting Started/i,
    });
    const vinDecodeLink = within(header).getByRole('link', {
      name: /VIN Decode/i,
    });

    expect(gettingStartedLink).toBeVisible();
    expect(vinDecodeLink).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /Maintenance/i })
    ).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /Cross Platform/i })
    ).toBeVisible();

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
      within(header).getByRole('link', { name: /Login \/ Sign Up/i })
    ).toBeVisible();

    // Getting Started should be first in the marketing nav sequence.
    expect(
      gettingStartedLink.compareDocumentPosition(vinDecodeLink) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeGreaterThan(0);
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
      within(header).queryByRole('link', { name: /VIN Decode/i })
    ).not.toBeInTheDocument();

    expect(garageLink).toBeVisible();
    expect(gettingStartedLink).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /^Profile$/i })
    ).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /^Timeline$/i })
    ).toBeVisible();
    expect(
      within(header).getByRole('link', { name: /^Upcoming$/i })
    ).toBeVisible();

    // Getting Started should be first in the authenticated app nav sequence.
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
});
