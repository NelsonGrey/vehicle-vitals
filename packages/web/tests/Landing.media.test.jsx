import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Landing from '../src/pages/Landing';

vi.mock('../src/components/SiteHeader', () => ({
  default: () => <header data-testid="site-header">Header</header>,
}));

vi.mock('../src/components/SiteFooter', () => ({
  default: () => <footer data-testid="site-footer">Footer</footer>,
}));

vi.mock('../src/components/HeaderAdBar', () => ({
  default: () => <div data-testid="header-ad-bar">Header Ad</div>,
}));

vi.mock('../src/components/InlineAdSection', () => ({
  default: () => <div data-testid="inline-ad-section">Inline Ad</div>,
}));

describe('Landing media surfaces', () => {
  it('renders marketing video showcase cards with expected MP4 paths', () => {
    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Landing />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Video showcase lanes/i })
    ).toBeInTheDocument();

    const expectedVideoPaths = [
      '/videos/feature-demos/onboarding-walkthrough.mp4',
      '/videos/feature-demos/maintenance-lifecycle-tour.mp4',
      '/videos/feature-demos/cross-platform-continuity.mp4',
    ];

    for (const path of expectedVideoPaths) {
      const source = container.querySelector(`video source[src="${path}"]`);
      expect(source).toBeTruthy();
    }

    const videoElements = container.querySelectorAll('video');
    expect(videoElements.length).toBeGreaterThanOrEqual(3);
  });
});
