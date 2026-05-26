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
    expect(
      screen.getByRole('link', { name: /Back to product overview/i })
    ).toHaveAttribute('href', '/');

    const screenshots = container.querySelectorAll(
      'img[alt*="application screenshot"]'
    );
    expect(screenshots.length).toBeGreaterThanOrEqual(6);

    const signInLinks = screen.getAllByRole('link', {
      name: /Sign in to open/i,
    });
    expect(signInLinks.length).toBeGreaterThanOrEqual(6);
  });
});
