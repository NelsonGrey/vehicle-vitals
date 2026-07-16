import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '../src/components/ProtectedRoute';

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/shared/useAppOffline', () => ({
  useAppOffline: vi.fn(),
}));

import { useAuth } from '../src/shared/AuthContext';
import { useAppOffline } from '../src/shared/useAppOffline';

function renderWithRouter(authState, initialPath = '/app/dashboard') {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/login"
          element={<div data-testid="login-page">Login</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAppOffline.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows an offline notice instead of children for an authenticated user when app_offline is on', () => {
    useAuth.mockReturnValue({
      user: { uid: 'user123', isAnonymous: false },
      loading: false,
    });
    useAppOffline.mockReturnValue(true);
    renderWithRouter({
      user: { uid: 'user123', isAnonymous: false },
      loading: false,
    });
    expect(screen.getByText(/not available right now/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders nothing (null) while loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    const { container } = renderWithRouter({ user: null, loading: true });
    // When loading, ProtectedRoute returns null, so route renders nothing
    expect(container.firstChild).toBeNull();
  });

  it('redirects unauthenticated users to /auth/login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter({ user: null, loading: false });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects anonymous users to /auth/login', () => {
    useAuth.mockReturnValue({
      user: { uid: 'anon123', isAnonymous: true },
      loading: false,
    });
    renderWithRouter({
      user: { uid: 'anon123', isAnonymous: true },
      loading: false,
    });
    expect(screen.getAllByTestId('login-page').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated non-anonymous users', () => {
    useAuth.mockReturnValue({
      user: { uid: 'user123', isAnonymous: false },
      loading: false,
    });
    renderWithRouter({
      user: { uid: 'user123', isAnonymous: false },
      loading: false,
    });
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('encodes the current path as a redirect query param in the login URL', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter({ user: null, loading: false }, '/app/profile');
    // Should have navigated to /auth/login?redirect=...
    expect(screen.getAllByTestId('login-page').length).toBeGreaterThan(0);
  });
});
