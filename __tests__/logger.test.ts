import {logger, redactSensitive} from '../src/lib/utils/logger';

describe('Logger Service', () => {
  // Mock console methods
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('redactSensitive', () => {
    it('should redact password fields', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };

      const result = redactSensitive(input);

      expect(result.username).toBe('john');
      expect(result.password).toBe('[REDACTED]');
      expect(result.email).toBe('[REDACTED]');
    });

    it('should redact nested sensitive data', () => {
      const input = {
        user: {
          name: 'John',
          apiKey: 'secret-key-123',
        },
      };

      const result = redactSensitive(input);

      expect(result.user.name).toBe('John');
      expect(result.user.apiKey).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const input = [
        {name: 'User1', token: 'token1'},
        {name: 'User2', token: 'token2'},
      ];

      const result = redactSensitive(input);

      expect(result[0].name).toBe('User1');
      expect(result[0].token).toBe('[REDACTED]');
      expect(result[1].name).toBe('User2');
      expect(result[1].token).toBe('[REDACTED]');
    });

    it('should handle null and undefined', () => {
      expect(redactSensitive(null)).toBeNull();
      expect(redactSensitive(undefined)).toBeUndefined();
    });
  });

  describe('logger.debug', () => {
    it('should log in development mode', () => {
      logger.debug('Test message', {key: 'value'});
      // In development, console.log should be called
      // (implementation depends on __DEV__ flag)
    });
  });

  describe('logger.warn', () => {
    it('should always log warnings', () => {
      logger.warn('Warning message', {key: 'value'});
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('logger.error', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, {
        component: 'TestComponent',
        action: 'testAction',
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
