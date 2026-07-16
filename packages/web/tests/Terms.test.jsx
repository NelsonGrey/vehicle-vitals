import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Terms from '../src/pages/Terms';

function renderTerms() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Terms />
    </MemoryRouter>
  );
}

describe('Terms page', () => {
  it('renders the terms of use heading', () => {
    renderTerms();
    expect(
      screen.getByRole('heading', { name: /Terms of Use/i, level: 1 })
    ).toBeInTheDocument();
  });

  it('sets the document title and canonical URL via PageSEO', () => {
    renderTerms();
    expect(document.title).toMatch(/Terms of Service/i);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      expect.stringContaining('/terms')
    );
  });
});
