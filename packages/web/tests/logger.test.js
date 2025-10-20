import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Firebase Analytics before importing logger
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({ analytics: true })),
  logEvent: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
}));

vi.mock('firebase/performance', () => ({
  getPerformance: vi.fn(() => ({ performance: true })),
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({ app: true })),
}));

// Mock console methods
const consoleSpy = {
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Import logger after mocks are set up
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import {
  analytics,
  AnalyticsEvent,
  errorTracking,
  log,
  logger,
  LogLevel,
} from '../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    // Reset logger state
    logger.clearUser();
  });

  afterEach(() => {
    // Restore console spies
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  describe('Basic logging functionality', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message');

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message'),
        expect.any(Object)
      );
    });

    it('should log info messages', () => {
      logger.info('Test info message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message'),
        expect.any(Object)
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning message'),
        expect.any(Object)
      );
    });

    it('should log error messages with error object', () => {
      const testError = new Error('Test error');
      logger.error('Test error message', testError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message - Test error'),
        testError,
        expect.any(Object)
      );
    });

    it('should log critical messages', () => {
      const testError = new Error('Critical error');
      logger.critical('Test critical message', testError);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(
          '[CRITICAL] Test critical message - Critical error'
        ),
        testError,
        expect.any(Object)
      );
    });
  });

  describe('Log levels', () => {
    it('should export correct log level values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.CRITICAL).toBe(4);
    });
  });

  describe('Analytics events', () => {
    it('should export analytics event constants', () => {
      expect(AnalyticsEvent.VEHICLE_ADDED).toBe('vehicle_added');
      expect(AnalyticsEvent.USER_LOGIN).toBe('login');
      expect(AnalyticsEvent.ERROR_OCCURRED).toBe('error_occurred');
    });
  });

  describe('User tracking', () => {
    it('should set user properties', () => {
      logger.setUser('user123', { email: 'test@example.com' });

      expect(setUserId).toHaveBeenCalledWith(logger.analytics, 'user123');
      expect(setUserProperties).toHaveBeenCalledWith(logger.analytics, {
        email: 'test@example.com',
      });
    });

    it('should clear user on logout', () => {
      logger.clearUser();

      expect(setUserId).toHaveBeenCalledWith(logger.analytics, null);
    });
  });

  describe('Analytics tracking', () => {
    it('should track custom events', () => {
      analytics.trackEvent('custom_event', { param: 'value' });

      expect(logEvent).toHaveBeenCalledWith(logger.analytics, 'custom_event', {
        param: 'value',
      });
    });

    it('should track user actions', () => {
      analytics.trackUserAction('add_vehicle', { make: 'Toyota' });

      expect(logEvent).toHaveBeenCalledWith(logger.analytics, 'vehicle_added', {
        make: 'Toyota',
      });
    });

    it('should track timing', () => {
      analytics.trackTiming('api_call', 1500, 'api');

      expect(logEvent).toHaveBeenCalledWith(
        logger.analytics,
        'timing_complete',
        {
          name: 'api_call',
          value: 1500,
          event_category: 'api',
        }
      );
    });
  });

  describe('Error tracking', () => {
    it('should capture exceptions', () => {
      const testError = new Error('Test exception');

      errorTracking.captureException(testError, { component: 'TestComponent' });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Exception captured - Test exception'),
        testError,
        expect.objectContaining({
          category: 'error',
          context: { component: 'TestComponent' },
        })
      );
    });

    it('should provide error boundary handler', () => {
      const handler = errorTracking.getErrorBoundaryHandler();
      const testError = new Error('Boundary error');
      const errorInfo = { componentStack: 'Test stack' };

      handler(testError, errorInfo);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Exception captured - Boundary error'),
        testError,
        expect.objectContaining({
          category: 'error',
          context: expect.objectContaining({
            componentStack: 'Test stack',
            errorBoundary: true,
          }),
        })
      );
    });
  });

  describe('Convenience log functions', () => {
    it('should provide convenience logging functions', () => {
      log.info('Convenience info');
      log.warn('Convenience warn');
      log.error('Convenience error', new Error('Test'));

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Convenience info'),
        expect.any(Object)
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Convenience warn'),
        expect.any(Object)
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Convenience error'),
        expect.any(Object)
      );
    });
  });

  describe('Log entry structure', () => {
    it('should include session ID in log entries', () => {
      logger.info('Test message');

      const callArgs = consoleSpy.info.mock.calls[0];
      const logData = callArgs[1];

      expect(logData).toHaveProperty('sessionId');
      expect(typeof logData.sessionId).toBe('string');
      expect(logData.sessionId).toMatch(/^session_/);
    });

    it('should include timestamp in log entries', () => {
      const before = new Date();
      logger.info('Test message');
      const after = new Date();

      const callArgs = consoleSpy.info.mock.calls[0];
      const logData = callArgs[1];

      expect(logData).toHaveProperty('timestamp');
      expect(logData.timestamp).toBeInstanceOf(Date);
      expect(logData.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(logData.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Production vs development behavior', () => {
    it('should initialize Firebase services in production', () => {
      // Test that Firebase is initialized (mocked)
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
    });

    it('should still log to console in development', () => {
      // Even in development mode, console logging should work
      logger.info('Dev test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Dev test message'),
        expect.any(Object)
      );
    });
  });
});
