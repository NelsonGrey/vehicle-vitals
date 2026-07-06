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
import {
  getHouseholdGarageStatus,
  promotePersonalGarageToHousehold,
} from '../src/utils/householdGarageService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
  getVehicles: vi.fn(),
  updateVehicle: vi.fn(),
}));

vi.mock('../src/shared/notificationService', () => ({
  requestNotificationPermission: vi.fn(),
}));

vi.mock('../src/utils/householdGarageService', () => ({
  getHouseholdGarageStatus: vi.fn(),
  promotePersonalGarageToHousehold: vi.fn(),
}));

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
    requestAccountConsolidation: vi.fn(),
    consolidateAccountData: vi.fn(),
  }),
}));

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

describe('Profile – household garage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.stubGlobal('firebase', MOCK_FIREBASE);
    window.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('default'),
    };

    getVehicle.mockResolvedValue(null);
    getVehicles.mockResolvedValue([]);
    updateVehicle.mockResolvedValue(undefined);
    requestNotificationPermission.mockResolvedValue(null);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.stubGlobal('firebase', undefined);
    delete window.Notification;
    vi.restoreAllMocks();
    cleanup();
  });

  it('shows a form to create a household garage for a personal garage', async () => {
    getHouseholdGarageStatus.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'personal',
      garageStorageMode: 'user_scoped',
    });

    render(<Profile />);

    await waitFor(() => screen.getByLabelText(/household garage name/i));
    expect(
      screen.getByRole('button', { name: /create household garage/i })
    ).toBeDisabled();
  });

  it('promotes a personal garage to a household garage', async () => {
    getHouseholdGarageStatus.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'personal',
      garageStorageMode: 'user_scoped',
    });
    promotePersonalGarageToHousehold.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'household',
      garageStorageMode: 'dual_write',
      name: 'The Nelson Household',
      vehiclesCopied: 2,
    });

    render(<Profile />);

    const nameInput = await screen.findByLabelText(/household garage name/i);
    fireEvent.change(nameInput, {
      target: { value: 'The Nelson Household' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /create household garage/i })
    );

    await waitFor(() =>
      expect(promotePersonalGarageToHousehold).toHaveBeenCalledWith({
        householdName: 'The Nelson Household',
      })
    );
    await waitFor(() =>
      screen.getByText(/is now a household garage/i)
    );
    expect(screen.getAllByText(/The Nelson Household/i).length).toBeGreaterThan(
      0
    );
  });

  it('shows current household status and a TODO note for invites when already a household', async () => {
    getHouseholdGarageStatus.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'household',
      garageStorageMode: 'dual_write',
      name: 'The Nelson Household',
    });

    render(<Profile />);

    await waitFor(() =>
      screen.getByText(/is a shared household garage/i)
    );
    expect(
      screen.getByText(/inviting additional members.*not yet available/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/household garage name/i)
    ).not.toBeInTheDocument();
  });
});
