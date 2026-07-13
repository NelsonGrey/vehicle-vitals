import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CollapsibleSection from '../src/components/CollapsibleSection';
import StackedVLogo from '../src/components/StackedVLogo';

describe('branding and disclosure controls', () => {
  it('renders the compact wordmark in uppercase', () => {
    render(<StackedVLogo compact size={52} />);

    expect(screen.getByText('VEHICLE VITALS')).toBeInTheDocument();
  });

  it('uses plus and minus for collapsed and expanded content', () => {
    render(
      <CollapsibleSection title="More information" defaultCollapsed>
        <p>Additional details</p>
      </CollapsibleSection>
    );

    const toggle = screen.getByRole('button', { name: /More information/i });
    expect(toggle).toHaveTextContent('+');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveTextContent('−');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Additional details')).toBeVisible();
  });
});
