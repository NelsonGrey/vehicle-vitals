import { cleanup, render, screen } from '@testing-library/react';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Component that throws an error
const ErrorComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary Component', () => {
  // Mock console.error to avoid noise in test output
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('catches and displays fallback UI when child throws error', () => {
    // Suppress console.error for this test since we expect an error
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    }).not.toThrow();

    // Restore console.error
    console.error = originalConsoleError;

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/We're sorry, but something unexpected happened/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /refresh page/i })
    ).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    }).not.toThrow();

    // Restore environment and console
    process.env.NODE_ENV = originalEnv;
    console.error = originalConsoleError;

    expect(
      screen.getByText('Error Details (Development Only)')
    ).toBeInTheDocument();
  });

  it('refresh button exists and is clickable', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    }).not.toThrow();

    console.error = originalConsoleError;

    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    expect(refreshButton).toBeInTheDocument();
    // Just verify the button is clickable (we can't easily test window.location.reload in jsdom)
    expect(refreshButton).not.toBeDisabled();
  });
});
