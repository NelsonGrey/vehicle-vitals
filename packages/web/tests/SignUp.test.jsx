import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SignUp from '../src/pages/SignUp';

const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithApple = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../src/shared/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
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

function renderSignUp() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SignUp />
    </MemoryRouter>
  );
}

describe('SignUp page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders email, password, and confirm-password fields', () => {
    renderSignUp();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders a Create Account button', () => {
    renderSignUp();
    expect(
      screen.getByRole('button', { name: /create.*account/i })
    ).toBeInTheDocument();
  });

  it('renders a link to the sign-in page', () => {
    renderSignUp();
    expect(
      screen.getByRole('link', { name: /sign in|already have/i })
    ).toBeInTheDocument();
  });

  it('shows password mismatch error without calling signUp', async () => {
    renderSignUp();

    await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'abc123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'xyz789');
    await userEvent.click(
      screen.getByRole('button', { name: /create.*account/i })
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      /passwords do not match/i
    );
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp with email and password when passwords match', async () => {
    mockSignUp.mockResolvedValue({});
    renderSignUp();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'new@example.com'
    );
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!');
    await userEvent.click(
      screen.getByRole('button', { name: /create.*account/i })
    );

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'Str0ng!');
    });
  });

  it('navigates after successful account creation', async () => {
    mockSignUp.mockResolvedValue({});
    renderSignUp();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'new@example.com'
    );
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!');
    await userEvent.click(
      screen.getByRole('button', { name: /create.*account/i })
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it('displays a server error when signUp fails', async () => {
    mockSignUp.mockRejectedValue(new Error('Email already in use'));
    renderSignUp();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      'dup@example.com'
    );
    await userEvent.type(screen.getByLabelText(/^password/i), 'Pass123!');
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'Pass123!'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /create.*account/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /email already in use/i
      );
    });
  });

  it('disables the submit button while busy', async () => {
    let resolveSignUp;
    mockSignUp.mockReturnValue(
      new Promise(resolve => {
        resolveSignUp = resolve;
      })
    );

    renderSignUp();
    await userEvent.type(screen.getByLabelText(/email address/i), 'x@x.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'abc');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'abc');
    await userEvent.click(
      screen.getByRole('button', { name: /create.*account/i })
    );

    const submitBtn = screen.getByRole('button', {
      name: /creating account/i,
    });
    expect(submitBtn).toBeDisabled();

    resolveSignUp();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue({});
    renderSignUp();

    const googleButton = screen.getByRole('button', { name: /google/i });
    await userEvent.click(googleButton);

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
  });
});
