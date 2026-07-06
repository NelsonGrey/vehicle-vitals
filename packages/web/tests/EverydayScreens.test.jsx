import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import EverydayScreens from '../src/pages/EverydayScreens';

describe('EverydayScreens page', () => {
  it('renders screenshot gallery cards and sign-in links', () => {
    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <EverydayScreens />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Everyday screens you will use/i })
    ).toBeInTheDocument();
    const screenshots = container.querySelectorAll(
      'img[alt*="application screenshot"]'
    );
    expect(screenshots.length).toBeGreaterThanOrEqual(6);

    expect(
      screen.getByRole('link', {
        name: /Open the public demo for Your garage overview/i,
      })
    ).toHaveAttribute('href', '/cross-platform-access-demo');
    expect(
      screen.getByRole('link', {
        name: /Open the public demo for Vehicle details/i,
      })
    ).toHaveAttribute('href', '/ownership-history-demo');
    expect(
      screen.getByRole('link', {
        name: /Open the public demo for Add vehicle screen/i,
      })
    ).toHaveAttribute('href', '/vin-lookup-demo');
    expect(
      screen.getByRole('link', {
        name: /Open the public demo for Service records/i,
      })
    ).toHaveAttribute('href', '/maintenance-planning-demo');
  });
});
