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

const mockSignOut = vi.fn(async () => {});
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const MOCK_USER = {
  uid: 'user-1',
  email: 'test@example.com',
  providerData: [{ providerId: 'password' }],
};
vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    reauthenticateWithGoogle: vi.fn(),
    reauthenticateWithApple: vi.fn(),
    signOut: mockSignOut,
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
      status: 'completed',
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
    await waitFor(() => screen.getByText(/your data export is ready/i));
    expect(requestAccountDataDeletion).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('immediately deletes the account and signs the user out', async () => {
    requestAccountDataDeletion.mockResolvedValue({
      success: true,
      requestId: 'req-delete-1',
      status: 'completed',
    });

    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /request account deletion/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /request account deletion/i })
    );

    await waitFor(() =>
      expect(requestAccountDataDeletion).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('does not sign out or navigate if the deletion request fails', async () => {
    requestAccountDataDeletion.mockRejectedValue(new Error('network error'));

    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /request account deletion/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /request account deletion/i })
    );

    await waitFor(() =>
      expect(requestAccountDataDeletion).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => screen.getByRole('alert'));
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('confirms with the user that deletion is immediate and irreversible before proceeding', async () => {
    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /request account deletion/i })
    );
    fireEvent.click(
      screen.getByRole('button', { name: /request account deletion/i })
    );

    await waitFor(() => expect(window.confirm).toHaveBeenCalledTimes(1));
    expect(window.confirm.mock.calls[0][0]).toMatch(
      /immediately.*permanently deletes|cannot be undone/i
    );
  });
});
