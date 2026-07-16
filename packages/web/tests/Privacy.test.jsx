import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Privacy from '../src/pages/Privacy';

function renderPrivacy() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Privacy />
    </MemoryRouter>
  );
}

describe('Privacy page', () => {
  it('renders the privacy policy heading', () => {
    renderPrivacy();
    expect(
      screen.getByRole('heading', { name: /Privacy Policy/i, level: 1 })
    ).toBeInTheDocument();
  });

  it('sets the document title and canonical URL via PageSEO', () => {
    renderPrivacy();
    expect(document.title).toMatch(/Privacy Policy/i);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      expect.stringContaining('/privacy')
    );
  });
});
