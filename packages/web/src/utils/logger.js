// Production logging utilities with Firebase integration
import { getApp } from 'firebase/app';
import { getPerformance } from 'firebase/performance';

// GA4 events go through GTM/gtag only (see firebaseConfig.ts) — never
// through the Firebase Analytics SDK, which would independently
// config/auto-pageview the same GA4 property a second time.
function gtagEvent(eventName, params) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// Analytics event types
export const AnalyticsEvent = {
  // User actions
  VEHICLE_ADDED: 'vehicle_added',
  VEHICLE_EDITED: 'vehicle_edited',
  VEHICLE_DELETED: 'vehicle_deleted',
  MAINTENANCE_ADDED: 'maintenance_added',
  MAINTENANCE_EDITED: 'maintenance_edited',
  MAINTENANCE_DELETED: 'maintenance_deleted',
  VIN_SCANNED: 'vin_scanned',
  DATA_EXPORTED: 'data_exported',

  // Navigation
  PAGE_VIEW: 'page_view',
  USER_LOGIN: 'login',
  USER_LOGOUT: 'logout',
  USER_SIGNUP: 'sign_up',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',

  // Performance
  APP_LOAD: 'app_load',
  API_RESPONSE_TIME: 'api_response_time',
};

class Logger {
  constructor() {
    this.performance = null;
    this.currentUserId = null;
    this.sessionId = this.generateSessionId();
    this.isProduction = import.meta.env.PROD;

    // Initialize Firebase Performance Monitoring in production
    if (this.isProduction) {
      try {
        const app = getApp();
        this.performance = getPerformance(app);
      } catch (error) {
        console.warn('Failed to initialize Firebase Performance:', error);
      }
    }
  }

  generateSessionId() {
    const bytes = new Uint8Array(12);
    if (
      globalThis.crypto &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      // Fallback for environments without Web Crypto support.
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = (Date.now() + i) & 0xff;
      }
    }
    const randomPart = Array.from(bytes, value =>
      value.toString(16).padStart(2, '0')
    ).join('');
    return `session_${Date.now()}_${randomPart}`;
  }

  // Set current user for analytics
  setUser(userId, properties) {
    this.currentUserId = userId;

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('set', { user_id: userId });
      if (properties) {
        window.gtag('set', 'user_properties', properties);
      }
    }
  }

  // Clear user on logout
  clearUser() {
    this.currentUserId = null;
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('set', { user_id: undefined });
    }
  }

  // Core logging method
  log(level, message, options = {}) {
    const entry = {
      level,
      message,
      userId: this.currentUserId || undefined,
      sessionId: this.sessionId,
      timestamp: new Date(),
      ...options,
    };

    // Console logging (always available)
    this.logToConsole(entry);

    // GA4 logging via GTM/gtag (production only)
    if (this.isProduction) {
      this.logToAnalytics(entry);
    }

    // Error tracking (production only)
    if (level >= LogLevel.ERROR && entry.error) {
      this.trackError(entry);
    }
  }

  logToConsole(entry) {
    const levelName = Object.keys(LogLevel).find(
      key => LogLevel[key] === entry.level
    );
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${levelName}]`;

    let logData = entry.data ? { ...entry.data } : {};

    if (entry.category) {
      logData.category = entry.category;
    }

    if (entry.context) {
      logData.context = entry.context;
    }

    if (entry.userId) {
      logData.userId = entry.userId;
    }

    const message = entry.error
      ? `${prefix} ${entry.message} - ${entry.error.message}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logData);
        break;
      case LogLevel.INFO:
        console.info(message, logData);
        break;
      case LogLevel.WARN:
        console.warn(message, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.error, logData);
        break;
    }
  }

  logToAnalytics(entry) {
    try {
      // Convert log entry to analytics event
      const eventName = this.getAnalyticsEventName(entry);
      const parameters = this.getAnalyticsParameters(entry);

      gtagEvent(eventName, parameters);
    } catch (error) {
      console.warn('Failed to log to Analytics:', error);
    }
  }

  getAnalyticsEventName(entry) {
    // Map log categories to analytics events
    if (entry.category) {
      switch (entry.category) {
        case 'user_action':
          return 'user_engagement';
        case 'navigation':
          return 'page_view';
        case 'error':
          return 'exception';
        case 'performance':
          return 'timing_complete';
        default:
          return 'custom_event';
      }
    }

    return 'log_event';
  }

  getAnalyticsParameters(entry) {
    const params = {
      level: Object.keys(LogLevel).find(key => LogLevel[key] === entry.level),
      message: entry.message.substring(0, 100), // Limit message length
      session_id: entry.sessionId,
    };

    if (entry.category) {
      params.category = entry.category;
    }

    if (entry.data) {
      // Add up to 5 custom parameters
      Object.entries(entry.data)
        .slice(0, 5)
        .forEach(([key, value]) => {
          params[`param_${key}`] = String(value).substring(0, 100);
        });
    }

    return params;
  }

  trackError(entry) {
    // In a real implementation, you might send to Sentry, Rollbar, etc.
    // For now, we'll just log to console with more detail
    if (entry.error) {
      console.error('Error tracked:', {
        message: entry.message,
        error: entry.error,
        stack: entry.error.stack,
        userId: entry.userId,
        sessionId: entry.sessionId,
        context: entry.context,
        timestamp: entry.timestamp,
      });
    }
  }

  // Public logging methods
  debug(message, options) {
    this.log(LogLevel.DEBUG, message, options);
  }

  info(message, options) {
    this.log(LogLevel.INFO, message, options);
  }

  warn(message, options) {
    this.log(LogLevel.WARN, message, options);
  }

  error(message, error, options) {
    this.log(LogLevel.ERROR, message, { ...options, error });
  }

  critical(message, error, options) {
    this.log(LogLevel.CRITICAL, message, { ...options, error });
  }

  // Analytics-specific methods
  trackEvent(event, parameters) {
    try {
      gtagEvent(event, parameters);
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }

    // Also log to console for development
    if (!this.isProduction) {
      console.info(`Analytics Event: ${event}`, parameters);
    }
  }

  // Performance tracking
  trackTiming(name, value, category = 'performance') {
    this.info(`Performance: ${name}`, {
      category,
      data: { timing: value, name },
    });

    try {
      gtagEvent('timing_complete', {
        name,
        value,
        event_category: category,
      });
    } catch (error) {
      console.warn('Failed to track timing:', error);
    }
  }

  // User action tracking
  trackUserAction(action, details) {
    this.info(`User Action: ${action}`, {
      category: 'user_action',
      data: details,
    });

    // Try to map to specific analytics event
    const eventName = this.mapActionToEvent(action);
    if (eventName) {
      this.trackEvent(eventName, details);
    }
  }

  mapActionToEvent(action) {
    const actionMap = {
      add_vehicle: AnalyticsEvent.VEHICLE_ADDED,
      edit_vehicle: AnalyticsEvent.VEHICLE_EDITED,
      delete_vehicle: AnalyticsEvent.VEHICLE_DELETED,
      add_maintenance: AnalyticsEvent.MAINTENANCE_ADDED,
      edit_maintenance: AnalyticsEvent.MAINTENANCE_EDITED,
      delete_maintenance: AnalyticsEvent.MAINTENANCE_DELETED,
      scan_vin: AnalyticsEvent.VIN_SCANNED,
      export_data: AnalyticsEvent.DATA_EXPORTED,
      login: AnalyticsEvent.USER_LOGIN,
      logout: AnalyticsEvent.USER_LOGOUT,
      signup: AnalyticsEvent.USER_SIGNUP,
    };

    return actionMap[action] || null;
  }

  // Error boundary integration
  captureException(error, context) {
    this.error('Exception captured', error, {
      category: 'error',
      context,
    });
  }

  // React error boundary helper
  getErrorBoundaryHandler() {
    return (error, errorInfo) => {
      this.captureException(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    };
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message, options) => logger.debug(message, options),
  info: (message, options) => logger.info(message, options),
  warn: (message, options) => logger.warn(message, options),
  error: (message, error, options) => logger.error(message, error, options),
  critical: (message, error, options) =>
    logger.critical(message, error, options),
};

// Analytics helpers
export const analytics = {
  trackEvent: (event, parameters) => logger.trackEvent(event, parameters),
  trackUserAction: (action, details) => logger.trackUserAction(action, details),
  trackTiming: (name, value, category) =>
    logger.trackTiming(name, value, category),
  setUser: (userId, properties) => logger.setUser(userId, properties),
  clearUser: () => logger.clearUser(),
};

// Error tracking
export const errorTracking = {
  captureException: (error, context) => logger.captureException(error, context),
  getErrorBoundaryHandler: () => logger.getErrorBoundaryHandler(),
};

export default logger;
