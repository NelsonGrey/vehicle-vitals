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
vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    reauthenticateWithGoogle: vi.fn(),
    reauthenticateWithApple: vi.fn(),
  }),
}));

const MOCK_FIREBASE = {
  auth: {
    EmailAuthProvider: { credential: () => ({}) },
    reauthenticateWithCredential: async () => {},
    updatePassword: async () => {},
    getAuth: () => ({}),
  },
  app: { getApp: () => ({}), initializeApp: () => ({}) },
  firestore: {},
  functions: {},
  messaging: {},
  storage: {},
};

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

    vi.stubGlobal('firebase', MOCK_FIREBASE);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.stubGlobal('firebase', undefined);
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

  it('files an account deletion request and keeps the copy truthful about staying signed in', async () => {
    requestAccountDataDeletion.mockResolvedValue({
      success: true,
      requestId: 'req-delete-1',
      status: 'requested',
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
    await waitFor(() => screen.getByText(/account deletion request filed/i));
    expect(
      screen.getByText(/you remain signed in until then/i)
    ).toBeInTheDocument();
  });

  it('does not offer an immediate irreversible delete button', async () => {
    renderPage();

    await waitFor(() =>
      screen.getByRole('button', { name: /request account deletion/i })
    );
    expect(
      screen.queryByRole('button', { name: /^delete account$/i })
    ).not.toBeInTheDocument();
  });
});
