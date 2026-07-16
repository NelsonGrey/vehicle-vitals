import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppEntryLink from '../src/components/AppEntryLink';

let mockIsAppOffline = false;

vi.mock('../src/shared/useAppOffline', () => ({
  useAppOffline: () => mockIsAppOffline,
}));

function renderLink(props = {}) {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AppEntryLink to="/auth/signup" className="cta" {...props}>
        Start Pro
      </AppEntryLink>
    </MemoryRouter>
  );
}

describe('AppEntryLink', () => {
  beforeEach(() => {
    mockIsAppOffline = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a real, working link when the app is online', () => {
    renderLink();
    const link = screen.getByRole('link', { name: /start pro/i });
    expect(link).toHaveAttribute('href', '/auth/signup');
  });

  it('renders a disabled, non-navigating element with a note when offline', () => {
    mockIsAppOffline = true;
    renderLink();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Start Pro')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
  });
});
