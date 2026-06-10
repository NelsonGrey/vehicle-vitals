import { render, screen } from '@testing-library/react';
import { CachedImage } from '../src/components/CachedImage';

describe('CachedImage Component', () => {
  it('renders image with src and alt', () => {
    render(<CachedImage src="https://example.com/image.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(
      <CachedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );
    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('custom-class');
  });

  it('renders with custom width and height', () => {
    render(
      <CachedImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={100}
        height={100}
      />
    );
    const img = screen.getByAltText('Test image');
    expect(img).toHaveStyle({ width: '100px', height: '100px' });
  });

  it('shows loader while loading', () => {
    render(<CachedImage src="https://example.com/image.jpg" alt="Test image" />);
    // The react-image library should show the loader initially
    const loader = screen.getByRole('img');
    expect(loader).toBeInTheDocument();
  });
});
