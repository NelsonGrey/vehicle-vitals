import { MemoryRouter } from 'react-router-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DataPrivacy from '../src/pages/DataPrivacy';
import {
  requestAccountDataDeletion,
  requestAccountDataExport,
} from '../src/utils/privacyRequestService';

vi.mock('../src/utils/privacyRequestService', () => ({
  requestAccountDataDeletion: vi.fn(),
  requestAccountDataExport: vi.fn(),
}));

const MOCK_USER = {
  uid: 'user-1',
  email: 'test@example.com',
  providerData: [{ providerId: 'password' }],
};
const mockSignOut = vi.fn(async () => {});
vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    signOut: mockSignOut,
    reauthenticateWithGoogle: vi.fn(),
    reauthenticateWithApple: vi.fn(),
  }),
}));

vi.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: vi.fn(() => ({})) },
  reauthenticateWithCredential: vi.fn(async () => {}),
  updatePassword: vi.fn(async () => {}),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <DataPrivacy />
    </MemoryRouter>
  );
}

describe('DataPrivacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('files a data export request without deleting the account', async () => {
    requestAccountDataExport.mockResolvedValue({
      success: true,
      requestId: 'req-export-1',
      status: 'requested',
    });

    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /request my data export/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /request my data export/i })
    );

    await waitFor(() =>
      expect(requestAccountDataExport).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => screen.getByText(/data export request filed/i));
    expect(requestAccountDataDeletion).not.toHaveBeenCalled();
  });

  it('deletes the account and signs out immediately, since the backend deletion is synchronous', async () => {
    requestAccountDataDeletion.mockResolvedValue({
      success: true,
      requestId: 'req-delete-1',
      status: 'completed',
    });

    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /^delete account$/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

    await waitFor(() =>
      expect(requestAccountDataDeletion).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });

  it('shows a distinct warning (not a deletion failure) when signOut fails after the account was already deleted', async () => {
    requestAccountDataDeletion.mockResolvedValue({
      success: true,
      requestId: 'req-delete-2',
      status: 'completed',
    });
    mockSignOut.mockRejectedValueOnce(
      new Error(
        'Signed out of this session, but could not fully clear the browser credential. Please close all tabs for this site to finish signing out.'
      )
    );

    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /^delete account$/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(/deletion request could not be filed/i)
    ).not.toBeInTheDocument();
    await waitFor(() =>
      screen.getByText(/could not fully clear the browser credential/i)
    );
  });
});
