import { MemoryRouter } from 'react-router-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AccountConsolidation from '../src/pages/AccountConsolidation';
import {
  getHouseholdGarageStatus,
  promotePersonalGarageToHousehold,
} from '../src/utils/householdGarageService';

vi.mock('../src/utils/householdGarageService', () => ({
  getHouseholdGarageStatus: vi.fn(),
  promotePersonalGarageToHousehold: vi.fn(),
}));

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
    requestAccountConsolidation,
    consolidateAccountData,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountConsolidation />
    </MemoryRouter>
  );
}

describe('AccountConsolidation – household garage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    consolidateAccountData.mockReset();
    requestAccountConsolidation.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
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

    renderPage();

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

    renderPage();

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
    await waitFor(() => screen.getByText(/is now a household garage/i));
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

    renderPage();

    await waitFor(() => screen.getByText(/is a shared household garage/i));
    expect(
      screen.getByText(/inviting additional members.*not yet available/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/household garage name/i)
    ).not.toBeInTheDocument();
  });
});

describe('AccountConsolidation – account merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getHouseholdGarageStatus.mockResolvedValue({
      success: true,
      orgId: 'org-1',
      orgType: 'personal',
      garageStorageMode: 'user_scoped',
    });
    consolidateAccountData.mockReset();
    requestAccountConsolidation.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('blocks account consolidation when the source UID matches the current user', async () => {
    renderPage();

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

    renderPage();

    const sourceUidInput = await screen.findByLabelText(/source account uid/i);
    fireEvent.change(sourceUidInput, {
      target: { value: 'source-user-2' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /send verification code/i })
    );

    await waitFor(() =>
      expect(requestAccountConsolidation).toHaveBeenCalledWith('source-user-2')
    );

    const codeInput = await screen.findByLabelText(/verification code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm & merge/i }));

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
