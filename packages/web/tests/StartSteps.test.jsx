import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import StartSteps from '../src/pages/StartSteps';

describe('StartSteps page', () => {
  it('renders step cards and expected navigation links', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <StartSteps />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Start in 3 simple steps/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /Back to product overview/i })
    ).toHaveAttribute('href', '/');

    expect(
      screen.getByRole('link', { name: /See add-vehicle demo/i })
    ).toHaveAttribute('href', '/getting-started');
    expect(
      screen.getByRole('link', { name: /See records demo/i })
    ).toHaveAttribute('href', '/maintenance-planning-demo');
    expect(
      screen.getByRole('link', { name: /See reminders demo/i })
    ).toHaveAttribute('href', '/cross-platform-access-demo');
  });
});
