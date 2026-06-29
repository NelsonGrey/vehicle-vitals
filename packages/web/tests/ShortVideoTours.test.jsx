import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ShortVideoTours from '../src/pages/ShortVideoTours';

describe('ShortVideoTours page', () => {
  it('renders dedicated video tour cards and expected video sources', () => {
    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ShortVideoTours />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Short video tours/i })
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
  });
});
