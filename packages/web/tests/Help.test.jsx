import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Help from '../src/pages/Help';

function renderHelp() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Help />
    </MemoryRouter>
  );
}

describe('Help page', () => {
  it('keeps reminder help public and omits the support skip link', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Help />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('link', { name: /Open reminder preferences/i })
    ).toHaveAttribute('href', '/help#maintenance-history-and-reminders');
    expect(
      screen.queryByRole('link', { name: /Skip to support contact/i })
    ).not.toBeInTheDocument();
  });

  it('scrolls to the maintenance reminders section when opened with the hash', () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    render(
      <MemoryRouter
        initialEntries={['/help#maintenance-history-and-reminders']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Help />
      </MemoryRouter>
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('shows standard support guidance with plan comparison link for non-priority tiers', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Help />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Standard support/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: /Compare support plans/i })[0]
    ).toHaveAttribute('href', '/app/subscription');
  });

  describe('legacy-term searchability', () => {
    it.each([
      ['Timeline', /What does Service History show\?/i],
      ['Upcoming Tasks', /How do I use Maintenance Plan\?/i],
      ['Mechanic', /How do I find nearby shops and services\?/i],
      ['Service Providers', /How do I find nearby shops and services\?/i],
      ['Profile', /How do profile preferences affect reminders\?/i],
    ])(
      'finds the current FAQ answer when searching the retired term "%s"',
      async (legacyTerm, expectedQuestion) => {
        renderHelp();
        const user = userEvent.setup();

        await user.type(
          screen.getByLabelText(/Search FAQs/i),
          legacyTerm
        );

        expect(screen.getByText(expectedQuestion)).toBeInTheDocument();
      }
    );
  });
});
