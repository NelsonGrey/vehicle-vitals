import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../src/pages/Login';

const mockSignIn = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithApple = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '' }),
  };
});

function renderLogin() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders email and password inputs and a Sign In button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it('renders a link to sign up', () => {
    renderLogin();
    expect(
      screen.getByRole('link', { name: /create.*account|sign up/i })
    ).toBeInTheDocument();
  });

  it('renders a link to the forgot password page', () => {
    renderLogin();
    expect(
      screen.getByRole('link', { name: /reset it|forgot/i })
    ).toBeInTheDocument();
  });

  it('calls signIn with the provided email and password on submit', async () => {
    mockSignIn.mockResolvedValue({});
    renderLogin();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'test@example.com'
    );
    await userEvent.type(screen.getByLabelText(/^password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'secret123');
    });
  });

  it('navigates after a successful sign in', async () => {
    mockSignIn.mockResolvedValue({});
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'pw');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it('displays an error message on failed sign in', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'bad@example.com'
    );
    await userEvent.type(screen.getByLabelText(/^password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /invalid credentials/i
      );
    });
  });

  it('disables the submit button while busy', async () => {
    let resolveSignIn;
    mockSignIn.mockReturnValue(
      new Promise(resolve => {
        resolveSignIn = resolve;
      })
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'pw');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const submitBtn = screen.getByRole('button', { name: /signing in/i });
    expect(submitBtn).toBeDisabled();

    resolveSignIn();
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/^password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show|hide/i });
    await userEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue({});
    renderLogin();

    const googleButton = screen.getByRole('button', { name: /google/i });
    await userEvent.click(googleButton);

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
  });

  it('shows an error if Google sign-in fails', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Popup closed'));
    renderLogin();

    const googleButton = screen.getByRole('button', { name: /google/i });
    await userEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/popup closed/i);
    });
  });
});
