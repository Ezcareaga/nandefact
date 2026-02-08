import type { ILogger } from '../../domain/shared/ILogger.js';

/**
 * Implementación de ILogger que envía logs estructurados a stdout/stderr.
 * Formato JSON para observabilidad y parsing por herramientas externas.
 */
export class ConsoleLogger implements ILogger {
  constructor(private readonly serviceName: string = 'nandefact-api') {}

  info(message: string, context?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        level: 'info',
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }),
    );
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(
      JSON.stringify({
        level: 'warn',
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }),
    );
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(
      JSON.stringify({
        level: 'error',
        service: this.serviceName,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      }),
    );
  }
}
