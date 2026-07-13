import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Instructions from '../src/pages/Instructions';

function renderInstructions() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Instructions />
    </MemoryRouter>
  );
}

describe('Instructions page (canonical Getting Started)', () => {
  it('renders the Getting Started heading and setup steps', () => {
    renderInstructions();

    expect(
      screen.getByRole('heading', { name: /^Getting Started$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Simple setup steps/i })
    ).toBeInTheDocument();
  });

  it('mentions Shops & Services as an optional last setup step', () => {
    renderInstructions();

    expect(
      screen.getByRole('link', { name: /Shops & Services/i })
    ).toHaveAttribute('href', '/app/providers');
  });

  it('renders the merged quick-look step cards migrated from the old How It Works page', () => {
    renderInstructions();

    expect(
      screen.getByRole('heading', { name: /Quick look at the first steps/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /See add-vehicle demo/i })
    ).toHaveAttribute('href', '/vin-lookup-demo');
    expect(
      screen.getByRole('link', { name: /See records demo/i })
    ).toHaveAttribute('href', '/maintenance-planning-demo');
    expect(
      screen.getByRole('link', { name: /See reminders demo/i })
    ).toHaveAttribute('href', '/help#maintenance-history-and-reminders');
  });

  it('sets the document title via PageSEO', () => {
    renderInstructions();

    expect(document.title).toMatch(/Getting Started/i);
  });
});
