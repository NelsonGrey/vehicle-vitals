import { MemoryRouter } from 'react-router-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MaintenanceAlerts from '../src/pages/MaintenanceAlerts';
import { getVehicle, updateVehicle } from '../src/shared/firestoreService';
import { requestNotificationPermission } from '../src/shared/notificationService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/shared/notificationService', () => ({
  requestNotificationPermission: vi.fn(),
}));

const MOCK_USER = {
  uid: 'user-1',
  email: 'test@example.com',
  providerData: [{ providerId: 'password' }],
};
vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MaintenanceAlerts />
    </MemoryRouter>
  );
}

describe('MaintenanceAlerts – push notification opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // jsdom doesn't include Notification; set it directly on window so
    // MaintenanceAlerts' `typeof Notification !== 'undefined'` check returns true.
    window.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('default'),
    };

    getVehicle.mockResolvedValue(null);
    updateVehicle.mockResolvedValue(undefined);
    requestNotificationPermission.mockResolvedValue(null);
  });

  afterEach(() => {
    delete window.Notification;
    vi.restoreAllMocks();
    cleanup();
  });

  it('shows an Enable button when no FCM token is stored', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Push Notifications'));
    expect(
      screen.getByRole('button', { name: /enable push notifications/i })
    ).toBeInTheDocument();
  });

  it('shows an enabled message when FCM token loaded from preferences', async () => {
    window.Notification.permission = 'granted';
    getVehicle.mockResolvedValue({ fcmToken: 'existing-token-abc' });
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/push notifications are enabled for this browser/i)
      ).toBeInTheDocument();
    });
  });

  it('calls requestNotificationPermission and saves token on Enable click', async () => {
    const TOKEN = 'fcm-token-xyz';
    requestNotificationPermission.mockResolvedValue(TOKEN);

    renderPage();
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
    renderPage();

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
    renderPage();
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
});
