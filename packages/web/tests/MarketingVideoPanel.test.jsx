import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MarketingVideoPanel from '../src/components/MarketingVideoPanel';

afterEach(() => {
  cleanup();
});

describe('MarketingVideoPanel', () => {
  it('renders video mode when a video path is provided', () => {
    const { container } = render(
      <MarketingVideoPanel
        title="Demo Lane"
        description="Demo description"
        poster="/images/features/add-vehicle.png"
        videoPath="/videos/feature-demos/demo.mp4"
      />
    );

    expect(screen.getByText('Playable demo')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Demo Lane' })
    ).toBeInTheDocument();
    expect(screen.getByText('Demo description')).toBeInTheDocument();
    expect(container.querySelector('video')).toBeTruthy();
  });

  it('falls back to poster preview when video fails to load', () => {
    const { container } = render(
      <MarketingVideoPanel
        title="Fallback Lane"
        description="Fallback description"
        poster="/images/features/timeline.png"
        videoPath="/videos/feature-demos/missing.mp4"
      />
    );

    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    if (video) {
      fireEvent.error(video);
    }

    expect(screen.getByText('Poster preview')).toBeInTheDocument();
    expect(
      screen.getByAltText('Fallback Lane video poster')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Video not found at /videos/feature-demos/missing.mp4. Add the clip to enable playback.'
      )
    ).toBeInTheDocument();
  });

  it('starts directly in poster mode when no video path is provided', () => {
    const { container } = render(
      <MarketingVideoPanel
        title="Poster Lane"
        description="Poster-only description"
        poster="/images/features/profile.png"
        videoPath=""
      />
    );

    expect(container.querySelector('video')).toBeFalsy();
    expect(screen.getByText('Poster preview')).toBeInTheDocument();
    expect(screen.getByAltText('Poster Lane video poster')).toBeInTheDocument();
  });
});
