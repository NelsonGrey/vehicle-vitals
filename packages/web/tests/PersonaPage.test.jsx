import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PersonaPage from '../src/pages/PersonaPage';

function renderPersona(path) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/personas/:personaId" element={<PersonaPage />} />
        <Route path="/" element={<div>Home fallback</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PersonaPage', () => {
  it('renders the DIY maintainer use case separately from new drivers', () => {
    renderPersona('/personas/diy-maintainers');

    expect(
      screen.getByRole('heading', {
        name: /Document the work you do yourself/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/DIY maintainer/i)).toBeInTheDocument();
    expect(screen.getByText(/parts, labor notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro to Premium/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /See record keeping/i })
    ).toHaveAttribute('href', '/ownership-history-demo');
  });

  it('redirects unknown persona ids back to home', () => {
    renderPersona('/personas/unknown');

    expect(screen.getByText(/Home fallback/i)).toBeInTheDocument();
  });
});
