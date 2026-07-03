// Sentry integration for production error monitoring
import * as Sentry from '@sentry/react-native';
import { logger } from './logger';
import { redactPhi } from './phiSecurity';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
}

export class SentryManager {
  private static isInitialized = false;

  static initialize(config: SentryConfig): void {
    if (this.isInitialized) {
      logger.warn('Sentry already initialized');
      return;
    }

    if (!config.dsn) {
      logger.warn('Sentry DSN not provided, skipping initialization');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment || 'development',
        release: config.release,
        tracesSampleRate: config.tracesSampleRate || 0.1,
        enableAutoSessionTracking: true,
        beforeSend: (event) => {
          if (config.environment === 'development') {
            if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
              return null;
            }
          }

          if (event.message) {
            event.message = redactPhi(event.message);
          }
          if (event.exception?.values) {
            event.exception.values = event.exception.values.map((val) => ({
              ...val,
              value: val.value ? redactPhi(val.value) : val.value,
            }));
          }

          return event;
        },
      });

      this.isInitialized = true;
      logger.info('Sentry initialized successfully', { environment: config.environment });
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error);
    }
  }

  static setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(user);
      logger.info('Sentry user set', { userId: user.id });
    } catch (error) {
      logger.error('Failed to set Sentry user:', error);
    }
  }

  static clearUser(): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(null);
      logger.info('Sentry user cleared');
    } catch (error) {
      logger.error('Failed to clear Sentry user:', error);
    }
  }

  static captureException(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, falling back to logger:', error);
      return;
    }

    try {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
      logger.info('Exception captured by Sentry', { message: error.message });
    } catch (sentryError) {
      logger.error('Failed to capture exception with Sentry:', sentryError);
      logger.error('Original exception:', error);
    }
  }

  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.isInitialized) {
      this.logByLevel(level, `Sentry not initialized: ${message}`, context);
      return;
    }

    try {
      Sentry.captureMessage(message, {
        level,
        contexts: context ? { custom: context } : undefined,
      });
      logger.info(`Message captured by Sentry: ${message}`, { level });
    } catch (error) {
      logger.error('Failed to capture message with Sentry:', error);
      this.logByLevel(level, `Original message: ${message}`, context);
    }
  }

  private static logByLevel(
    level: Sentry.SeverityLevel,
    message: string,
    context?: Record<string, any>
  ): void {
    switch (level) {
      case 'fatal':
      case 'error':
        logger.error(message, context);
        break;
      case 'warning':
        logger.warn(message, context);
        break;
      case 'debug':
        logger.debug(message, context);
        break;
      default:
        logger.info(message, context);
    }
  }

  static addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category || 'default',
        level: breadcrumb.level || 'info',
        data: breadcrumb.data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      logger.error('Failed to add Sentry breadcrumb:', error);
    }
  }

  static setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      logger.error('Failed to set Sentry context:', error);
    }
  }

  static startTransaction(name: string, operation: string = 'navigation'): void {
    if (!this.isInitialized) return;

    try {
      Sentry.startSpan({ name, op: operation }, () => undefined);
      logger.info('Sentry span started', { name, operation });
    } catch (error) {
      logger.error('Failed to start Sentry span:', error);
    }
  }

  static isReady(): boolean {
    return this.isInitialized;
  }
}

// Integration with error handler
export const setupSentryIntegration = (config: SentryConfig) => {
  SentryManager.initialize(config);

  // Override error handler to send to Sentry
  const originalHandleError = (global as any).handleError;
  if (originalHandleError) {
    (global as any).handleError = (error: Error, context?: string) => {
      SentryManager.captureException(error, { context });
      return originalHandleError(error, context);
    };
  }
};
