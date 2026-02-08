import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleLogger } from '../../../../src/infrastructure/logging/ConsoleLogger.js';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new ConsoleLogger('test-service');
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should output structured JSON for info level', () => {
    logger.info('Test message', { userId: '123', action: 'test' });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);

    expect(loggedData).toMatchObject({
      level: 'info',
      service: 'test-service',
      message: 'Test message',
      userId: '123',
      action: 'test',
    });
    expect(loggedData.timestamp).toBeDefined();
    expect(new Date(loggedData.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should output structured JSON for warn level', () => {
    logger.warn('Warning message', { comercioId: 'abc', reason: 'expired' });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);

    expect(loggedData).toMatchObject({
      level: 'warn',
      service: 'test-service',
      message: 'Warning message',
      comercioId: 'abc',
      reason: 'expired',
    });
    expect(loggedData.timestamp).toBeDefined();
  });

  it('should output structured JSON for error level', () => {
    logger.error('Error occurred', { cdc: '12345', errorCode: 500 });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);

    expect(loggedData).toMatchObject({
      level: 'error',
      service: 'test-service',
      message: 'Error occurred',
      cdc: '12345',
      errorCode: 500,
    });
    expect(loggedData.timestamp).toBeDefined();
  });

  it('should handle missing context gracefully', () => {
    logger.info('Message without context');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);

    expect(loggedData).toMatchObject({
      level: 'info',
      service: 'test-service',
      message: 'Message without context',
    });
  });

  it('should use default service name when not provided', () => {
    const defaultLogger = new ConsoleLogger();
    defaultLogger.info('Default service');

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);

    expect(loggedData.service).toBe('nandefact-api');
  });
});
