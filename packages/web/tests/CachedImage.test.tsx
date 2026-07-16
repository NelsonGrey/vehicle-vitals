import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CachedImage } from '../src/components/CachedImage';

vi.mock('react-image', () => ({
  Img: ({
    src,
    alt,
    className,
    style,
  }: {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
  }) => <img src={src} alt={alt} className={className} style={style} />,
}));

describe('CachedImage Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders image with src and alt', () => {
    render(<CachedImage src="https://example.com/image.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders with custom className', () => {
    render(
      <CachedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );
    expect(screen.getByAltText('Test image')).toHaveClass('custom-class');
  });

  it('renders with custom width and height', () => {
    render(
      <CachedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={100}
        height={80}
      />
    );
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });
});
