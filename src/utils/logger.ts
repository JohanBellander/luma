/**
 * Simple logging utility for LUMA
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  constructor() {
    // Allow environment variable override e.g. LUMA_LOG_LEVEL=debug
    const env = (process.env.LUMA_LOG_LEVEL || '').toLowerCase();
    switch (env) {
      case 'debug':
        this.level = LogLevel.DEBUG; break;
      case 'info':
        this.level = LogLevel.INFO; break;
      case 'warn':
        this.level = LogLevel.WARN; break;
      case 'error':
        this.level = LogLevel.ERROR; break;
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel { return this.level; }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
