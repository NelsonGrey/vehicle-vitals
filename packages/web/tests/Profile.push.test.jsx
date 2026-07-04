import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Profile from '../src/pages/Profile';
import {
  getVehicle,
  getVehicles,
  updateVehicle,
} from '../src/shared/firestoreService';
import { requestNotificationPermission } from '../src/shared/notificationService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
  getVehicles: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/shared/notificationService', () => ({
  requestNotificationPermission: vi.fn(),
}));

// Profile only renders when useAuth returns a user.
// Use a stable object reference for `user` so the [user] useEffect dependency
// does not change on every render, preventing an infinite loadPreferences loop.
const consolidateAccountData = vi.fn();
const requestAccountConsolidation = vi.fn();
const MOCK_USER = {
  uid: 'user-1',
  email: 'test@example.com',
  providerData: [{ providerId: 'password' }],
};
vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    signOut: vi.fn(),
    linkWithGoogle: vi.fn(),
    linkWithApple: vi.fn(),
    requestAccountConsolidation,
    consolidateAccountData,
  }),
}));

// Provide a minimal window.firebase so checkFirebase() in createFirebaseAuthService
// resolves synchronously on its very first call — no 5-second polling in tests.
const MOCK_FIREBASE = {
  auth: {
    EmailAuthProvider: { credential: () => ({}) },
    reauthenticateWithCredential: async () => {},
    updatePassword: async () => {},
    deleteUser: async () => {},
    getAuth: () => ({}),
  },
  app: { getApp: () => ({}), initializeApp: () => ({}) },
  firestore: {},
  functions: {},
  messaging: {},
  storage: {},
};

describe('Profile – push notification opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // stubGlobal sets window.firebase; vi.unstubAllGlobals() in afterEach rolls it back.
    vi.stubGlobal('firebase', MOCK_FIREBASE);

    // jsdom doesn't include Notification; set it directly on window so Profile's
    // `typeof Notification !== 'undefined'` check returns true. Avoid
    // vi.stubGlobal('Notification') — it hangs in jsdom due to internal descriptor
    // conflicts.
    window.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('default'),
    };

    getVehicle.mockResolvedValue(null);
    getVehicles.mockResolvedValue([]);
    updateVehicle.mockResolvedValue(undefined);
    requestNotificationPermission.mockResolvedValue(null);
    consolidateAccountData.mockReset();
    requestAccountConsolidation.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    // Explicitly restore the two stubs — do NOT call vi.unstubAllGlobals() as
    // it causes the test runner to hang in jsdom.
    vi.stubGlobal('firebase', undefined);
    delete window.Notification;
    vi.restoreAllMocks();
    cleanup();
  });

  it('shows "Disabled" push status when no FCM token is stored', async () => {
    render(<Profile />);
    await waitFor(() => screen.getByText('Push Notifications'));
    expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0);
  });

  it('shows "Enabled" push status when FCM token loaded from preferences', async () => {
    getVehicle.mockResolvedValue({ fcmToken: 'existing-token-abc' });
    render(<Profile />);
    await waitFor(() => screen.getByText('Push Notifications'));
    expect(screen.getAllByText('Enabled').length).toBeGreaterThan(0);
  });

  it('calls requestNotificationPermission and saves token on Enable click', async () => {
    const TOKEN = 'fcm-token-xyz';
    requestNotificationPermission.mockResolvedValue(TOKEN);

    render(<Profile />);
    await waitFor(() =>
      screen.getByRole('button', { name: /enable push notifications/i })
    );

    fireEvent.click(
      screen.getByRole('button', { name: /enable push notifications/i })
    );

    await waitFor(() =>
      expect(requestNotificationPermission).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(updateVehicle).toHaveBeenCalledWith('preferences', {
        fcmToken: TOKEN,
      })
    );
  });

  it('saves empty string and switches to Enable button on Disable click', async () => {
    getVehicle.mockResolvedValue({ fcmToken: 'existing-token' });
    render(<Profile />);

    const disableBtn = await screen.findByRole('button', {
      name: /disable push notifications/i,
    });
    fireEvent.click(disableBtn);

    await waitFor(() =>
      expect(updateVehicle).toHaveBeenCalledWith('preferences', {
        fcmToken: '',
      })
    );
    await waitFor(() =>
      screen.getByRole('button', { name: /enable push notifications/i })
    );
  });

  it('shows error when requestNotificationPermission returns null', async () => {
    requestNotificationPermission.mockResolvedValue(null);
    render(<Profile />);
    await waitFor(() =>
      screen.getByRole('button', { name: /enable push notifications/i })
    );

    fireEvent.click(
      screen.getByRole('button', { name: /enable push notifications/i })
    );

    await waitFor(() =>
      screen.getByText(/push notifications could not be enabled/i)
    );
    expect(updateVehicle).not.toHaveBeenCalledWith(
      'preferences',
      expect.objectContaining({ fcmToken: expect.any(String) })
    );
  });

  it('blocks account consolidation when the source UID matches the current user', async () => {
    render(<Profile />);

    await waitFor(() => screen.getByLabelText(/source account uid/i));

    fireEvent.change(screen.getByLabelText(/source account uid/i), {
      target: { value: MOCK_USER.uid },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /send verification code/i })
    );

    await waitFor(() =>
      screen.getByText(/cannot consolidate an account with itself/i)
    );
    expect(requestAccountConsolidation).not.toHaveBeenCalled();
    expect(consolidateAccountData).not.toHaveBeenCalled();
  });

  it('shows consolidation results after a successful account merge', async () => {
    requestAccountConsolidation.mockResolvedValue({
      success: true,
      sentTo: 's***@example.com',
    });
    consolidateAccountData.mockResolvedValue({
      success: true,
      sourceUid: 'source-user-2',
      primaryUid: MOCK_USER.uid,
      vehiclesMigrated: 2,
      vehicleSkipped: 1,
      migratedVins: ['VIN123', 'VIN456'],
      message: 'Successfully migrated 2 vehicle(s) from source account',
    });

    render(<Profile />);

    const sourceUidInput = await screen.findByLabelText(/source account uid/i);
    fireEvent.change(sourceUidInput, {
      target: { value: 'source-user-2' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /send verification code/i })
    );

    await waitFor(() =>
      expect(requestAccountConsolidation).toHaveBeenCalledWith(
        'source-user-2'
      )
    );

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(
      screen.getByRole('button', { name: /confirm & merge/i })
    );

    await waitFor(() =>
      expect(consolidateAccountData).toHaveBeenCalledWith({
        sourceUid: 'source-user-2',
        verificationCode: '123456',
      })
    );
    await waitFor(() => screen.getByText(/consolidation successful!/i));
    expect(
      screen.getByText(
        /successfully migrated 2 vehicle\(s\) from the source account/i
      )
    ).toBeTruthy();
    expect(screen.getByText(/migrated vehicles: 2/i)).toBeTruthy();
    expect(screen.getByText(/skipped vehicles: 1/i)).toBeTruthy();
    expect(screen.getByText(/vehicle ids: VIN123, VIN456/i)).toBeTruthy();
    expect(sourceUidInput.value).toBe('');
  });
});
