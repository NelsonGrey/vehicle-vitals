import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getUpcomingMaintenance } from '@vehicle-vitals/shared';
import UpcomingTasks from '../src/pages/UpcomingTasks';
import {
  completeReminder,
  dismissReminder,
  getReminders,
  getVehicle,
  getVehicles,
  markReminderDelivery,
  reopenReminder,
  snoozeReminder,
} from '../src/shared/firestoreService';
import { createMaintenanceCalendarEvent } from '../src/utils/calendarService';
import { sendReminderDeliveryEmail } from '../src/utils/reminderDeliveryService';

const mockUseFeatureFlag = vi.fn(() => true);

vi.mock('../src/shared/firestoreService', () => ({
  getVehicle: vi.fn(),
  getVehicles: vi.fn(),
  getReminders: vi.fn(),
  addReminder: vi.fn(),
  completeReminder: vi.fn(),
  snoozeReminder: vi.fn(),
  dismissReminder: vi.fn(),
  reopenReminder: vi.fn(),
  markReminderDelivery: vi.fn(),
}));

vi.mock('@vehicle-vitals/shared', () => ({
  getUpcomingMaintenance: vi.fn(() => []),
}));

vi.mock('../src/utils/calendarService', () => ({
  createMaintenanceCalendarEvent: vi.fn(),
}));

vi.mock('../src/utils/reminderDeliveryService', () => ({
  sendReminderDeliveryEmail: vi.fn(),
}));

vi.mock('../src/shared/useMonetization', () => ({
  useFeatureFlag: (...args) => mockUseFeatureFlag(...args),
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

const renderUpcomingTasks = (initialEntries = ['/app/upcoming']) =>
  render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <UpcomingTasks />
    </MemoryRouter>
  );

describe('UpcomingTasks reminder actions', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'open').mockImplementation(() => null);
    mockUseFeatureFlag.mockImplementation(() => true);
    getVehicle.mockResolvedValue(null);
    getVehicles.mockResolvedValue([VEHICLE]);
    getReminders.mockResolvedValue([ACTIVE_REMINDER]);
    completeReminder.mockResolvedValue(undefined);
    snoozeReminder.mockResolvedValue(undefined);
    dismissReminder.mockResolvedValue(undefined);
    reopenReminder.mockResolvedValue(undefined);
    markReminderDelivery.mockResolvedValue(undefined);
    createMaintenanceCalendarEvent.mockResolvedValue({
      actionUrl: 'https://calendar.example/event',
    });
    sendReminderDeliveryEmail.mockResolvedValue({ success: true });
    getUpcomingMaintenance.mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders saved reminders after loading', async () => {
    renderUpcomingTasks();

    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
    });
  });

  it('calls completeReminder with correct args when Complete is clicked', async () => {
    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Oil Change'));

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(completeReminder).toHaveBeenCalledWith('VIN001', 'rem-1');
    });
  });

  it('calls snoozeReminder with correct vin and id when Snooze is clicked', async () => {
    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Oil Change'));

    fireEvent.click(screen.getByRole('button', { name: 'Snooze 14 Days' }));

    await waitFor(() => {
      expect(snoozeReminder).toHaveBeenCalledWith(
        'VIN001',
        'rem-1',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
    });
  });

  it('calls dismissReminder with correct args when Dismiss is clicked', async () => {
    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Oil Change'));

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => {
      expect(dismissReminder).toHaveBeenCalledWith('VIN001', 'rem-1');
    });
  });

  it('shows Restore button for dismissed reminders and calls reopenReminder', async () => {
    getReminders.mockResolvedValue([DISMISSED_REMINDER]);
    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Tire Rotation'));

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(reopenReminder).toHaveBeenCalledWith('VIN001', 'rem-2');
    });
  });

  it('shows empty state when no reminders exist', async () => {
    getReminders.mockResolvedValue([]);
    renderUpcomingTasks();

    await waitFor(() => {
      expect(
        screen.getByText('No saved reminders match this filter yet.')
      ).toBeInTheDocument();
    });
  });

  it('filter buttons change which reminders are visible', async () => {
    getReminders.mockResolvedValue([ACTIVE_REMINDER, DISMISSED_REMINDER]);
    renderUpcomingTasks();

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

  it('creates calendar event for an upcoming item', async () => {
    getReminders.mockResolvedValue([]);
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oil_change',
        description: 'Oil and filter change',
        frequency: 'Every 5,000 miles',
        interval: 5000,
        nextDueMileage: 35000,
        milesUntilDue: 400,
      },
    ]);

    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Oil and filter change'));
    fireEvent.click(screen.getByRole('button', { name: 'Add to Calendar' }));

    await waitFor(() => {
      expect(createMaintenanceCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleVin: 'VIN001',
          title: 'Oil and filter change',
          target: 'google',
        })
      );
    });
    expect(window.open).toHaveBeenCalledWith(
      'https://calendar.example/event',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('sends reminder email and persists sent delivery status', async () => {
    const reminderWithMileage = {
      ...ACTIVE_REMINDER,
      nextDueMileage: 35000,
    };
    getReminders.mockResolvedValue([reminderWithMileage]);
    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Oil Change'));
    fireEvent.change(screen.getByLabelText('Send reminder email to'), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Email Now' }));

    await waitFor(() => {
      expect(sendReminderDeliveryEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
          vehicle: expect.objectContaining({ vin: 'VIN001' }),
        })
      );
    });
    expect(markReminderDelivery).toHaveBeenCalledWith(
      'VIN001',
      'rem-1',
      expect.objectContaining({
        deliveryStatus: 'sent',
      })
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Reminder email sent to owner@example.com.'
    );
  });

  it('persists failed delivery status when email send fails', async () => {
    sendReminderDeliveryEmail.mockRejectedValueOnce(new Error('Provider down'));
    renderUpcomingTasks();

    await waitFor(() => screen.getByText('Oil Change'));
    fireEvent.change(screen.getByLabelText('Send reminder email to'), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Email Now' }));

    await waitFor(() => {
      expect(markReminderDelivery).toHaveBeenCalledWith(
        'VIN001',
        'rem-1',
        expect.objectContaining({
          deliveryStatus: 'failed',
          lastDeliveryError: 'Provider down',
        })
      );
    });
  });

  it('filters reminders to the notification VIN when opened from push', async () => {
    const secondVehicle = {
      vin: 'VIN999',
      make: 'Honda',
      model: 'Accord',
      year: '2021',
      mileage: '42000',
    };

    getVehicles.mockResolvedValue([VEHICLE, secondVehicle]);
    getReminders.mockImplementation(async vin => {
      if (vin === 'VIN999') {
        return [
          {
            id: 'rem-99',
            title: 'Brake Flush',
            serviceType: 'brake_flush',
            status: 'active',
          },
        ];
      }

      return [ACTIVE_REMINDER];
    });

    renderUpcomingTasks(['/app/upcoming?source=push&vin=VIN999']);

    await waitFor(() =>
      expect(
        screen.getByText(/Opened from a maintenance reminder notification/i)
      ).toBeInTheDocument()
    );
    expect(screen.getByText('Brake Flush')).toBeInTheDocument();
    expect(screen.queryByText('Oil Change')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /show all vehicles/i })
    ).toHaveAttribute('href', '/app/upcoming');
  });

  it('shows predicted due date when ai predictions feature is enabled', async () => {
    getReminders.mockResolvedValue([]);
    getUpcomingMaintenance.mockReturnValue([
      {
        id: 'oil_change',
        description: 'Oil and filter change',
        frequency: 'Every 5,000 miles',
        interval: 5000,
        nextDueMileage: 35000,
        milesUntilDue: 400,
      },
    ]);

    renderUpcomingTasks();

    await waitFor(() => {
      expect(screen.getByText(/Predicted due date:/i)).toBeInTheDocument();
    });
  });

  it('shows upgrade guidance when advanced reminders feature is disabled', async () => {
    mockUseFeatureFlag.mockImplementation(featureName => {
      if (featureName === 'advanced_reminders') {
        return false;
      }
      return true;
    });

    renderUpcomingTasks();

    await waitFor(() => {
      expect(
        screen.getByText(/Advanced reminder timing controls are available/i)
      ).toBeInTheDocument();
    });
  });
});
