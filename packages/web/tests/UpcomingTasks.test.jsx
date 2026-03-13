import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import UpcomingTasks from '../src/pages/UpcomingTasks';
import {
  completeReminder,
  dismissReminder,
  getReminders,
  getVehicle,
  getVehicles,
  reopenReminder,
  snoozeReminder,
} from '../src/shared/firestoreService';

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
  getVehicles: vi.fn(),
  getReminders: vi.fn(),
  addReminder: vi.fn(),
  completeReminder: vi.fn(),
  snoozeReminder: vi.fn(),
  dismissReminder: vi.fn(),
  reopenReminder: vi.fn(),
}));

vi.mock('@vehicle-vitals/shared', () => ({
  getUpcomingMaintenance: vi.fn(() => []),
}));

const VEHICLE = {
  vin: 'VIN001',
  make: 'Toyota',
  model: 'Camry',
  year: '2022',
  mileage: '30000',
};

const ACTIVE_REMINDER = {
  id: 'rem-1',
  title: 'Oil Change',
  serviceType: 'oil_change',
  status: 'active',
};

const DISMISSED_REMINDER = {
  id: 'rem-2',
  title: 'Tire Rotation',
  serviceType: 'tire_rotation',
  status: 'dismissed',
};

describe('UpcomingTasks reminder actions', () => {
  beforeEach(() => {
    getVehicle.mockResolvedValue(null);
    getVehicles.mockResolvedValue([VEHICLE]);
    getReminders.mockResolvedValue([ACTIVE_REMINDER]);
    completeReminder.mockResolvedValue(undefined);
    snoozeReminder.mockResolvedValue(undefined);
    dismissReminder.mockResolvedValue(undefined);
    reopenReminder.mockResolvedValue(undefined);
    getUpcomingMaintenance.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders saved reminders after loading', async () => {
    render(<UpcomingTasks />);

    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });
  });

  it('calls completeReminder with correct args when Complete is clicked', async () => {
    render(<UpcomingTasks />);

    await waitFor(() => screen.getByText('Oil Change'));

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(completeReminder).toHaveBeenCalledWith('VIN001', 'rem-1');
    });
  });

  it('calls snoozeReminder with correct vin and id when Snooze is clicked', async () => {
    render(<UpcomingTasks />);

    await waitFor(() => screen.getByText('Oil Change'));

    fireEvent.click(screen.getByRole('button', { name: 'Snooze 2 Weeks' }));

    await waitFor(() => {
      expect(snoozeReminder).toHaveBeenCalledWith(
        'VIN001',
        'rem-1',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
    });
  });

  it('calls dismissReminder with correct args when Dismiss is clicked', async () => {
    render(<UpcomingTasks />);

    await waitFor(() => screen.getByText('Oil Change'));

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => {
      expect(dismissReminder).toHaveBeenCalledWith('VIN001', 'rem-1');
    });
  });

  it('shows Restore button for dismissed reminders and calls reopenReminder', async () => {
    getReminders.mockResolvedValue([DISMISSED_REMINDER]);
    render(<UpcomingTasks />);

    await waitFor(() => screen.getByText('Tire Rotation'));

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(reopenReminder).toHaveBeenCalledWith('VIN001', 'rem-2');
    });
  });

  it('shows empty state when no reminders exist', async () => {
    getReminders.mockResolvedValue([]);
    render(<UpcomingTasks />);

    await waitFor(() => {
      expect(
        screen.getByText('No reminders in this view.')
      ).toBeInTheDocument();
    });
  });

  it('filter buttons change which reminders are visible', async () => {
    getReminders.mockResolvedValue([ACTIVE_REMINDER, DISMISSED_REMINDER]);
    render(<UpcomingTasks />);

    await waitFor(() => screen.getByText('Oil Change'));

    // Dismissed filter — should hide active reminder
    fireEvent.click(screen.getByRole('button', { name: /^Dismissed/ }));
    expect(screen.queryByText('Oil Change')).not.toBeInTheDocument();
    expect(screen.getByText('Tire Rotation')).toBeInTheDocument();

    // Active filter — should show only active
    fireEvent.click(screen.getByRole('button', { name: /^Active/ }));
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.queryByText('Tire Rotation')).not.toBeInTheDocument();
  });
});
