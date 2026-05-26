import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Help from '../src/pages/Help';

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
});
