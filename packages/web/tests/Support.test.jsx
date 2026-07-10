import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Support from '../src/pages/Support';

const mockSubmitSupportRequest = vi.fn();

vi.mock('../src/utils/supportRequestService', () => ({
  SUPPORT_REQUEST_TOPICS: [
    'Bug Report',
    'Account / Login',
    'Billing / Subscription',
    'VIN Lookup / Vehicle Data',
    'Feature Request',
    'Other',
  ],
  submitSupportRequest: (...args) => mockSubmitSupportRequest(...args),
}));

describe('Support', () => {
  beforeEach(() => {
    mockSubmitSupportRequest.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render a mailto link — the form is the only way to reach support', () => {
    render(<Support />);
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('renders all form fields with the expected topics', () => {
    render(<Support />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Bug Report' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Billing / Subscription' })
    ).toBeInTheDocument();
  });

  it('submits the form and shows a success message', async () => {
    mockSubmitSupportRequest.mockResolvedValue({ success: true });
    render(<Support />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Jamie Driver' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jamie@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Topic'), {
      target: { value: 'Bug Report' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'The app crashes when I add a vehicle.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() =>
      expect(mockSubmitSupportRequest).toHaveBeenCalledWith({
        name: 'Jamie Driver',
        email: 'jamie@example.com',
        topic: 'Bug Report',
        message: 'The app crashes when I add a vehicle.',
      })
    );
    await waitFor(() => screen.getByRole('status'));
    expect(screen.getByRole('status')).toHaveTextContent(
      /your message has been sent/i
    );
  });

  it('shows an error message when submission fails', async () => {
    mockSubmitSupportRequest.mockRejectedValue(
      new Error('Too many support requests — please wait before trying again')
    );
    render(<Support />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Jamie Driver' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jamie@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Topic'), {
      target: { value: 'Bug Report' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'The app crashes when I add a vehicle.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent(/too many support/i);
  });
});
