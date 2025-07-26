/**
 * Centralized logging system for Prisma Joi Generator
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Minimum log level to display */
  level?: LogLevel;
  /** Prefix for all log messages */
  prefix?: string;
}

export class Logger {
  private config: Required<LoggerConfig>;
  private startTime: number;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      debug: process.env.PRISMA_JOI_DEBUG === 'true' || config.debug || false,
      level: (process.env.PRISMA_JOI_LOG_LEVEL as LogLevel) || config.level || 'info',
      prefix: config.prefix || '🔧 Prisma Joi Generator',
    };
    this.startTime = Date.now();
  }

  /**
   * Log debug information (only shown in debug mode)
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.log('debug', `🐛 ${message}`, data);
    }
  }

  /**
   * Log general information
   */
  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.log('info', `ℹ️  ${message}`, data);
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.log('warn', `⚠️  ${message}`, data);
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | any): void {
    if (this.shouldLog('error')) {
      this.log('error', `❌ ${message}`, error);
      if (error instanceof Error && this.config.debug) {
        this.log('error', `Stack trace: ${error.stack}`);
      }
    }
  }

  /**
   * Log generation start
   */
  generationStart(modelCount: number, enabledTypes: string[]): void {
    this.info(`Starting generation for ${modelCount} models`);
    this.debug(`Enabled file types: ${enabledTypes.join(', ')}`);
  }

  /**
   * Log generation completion
   */
  generationComplete(fileCount: number): void {
    const duration = Date.now() - this.startTime;
    this.info(`✅ Generated ${fileCount} files in ${duration}ms`);
  }

  /**
   * Log file type generation progress
   */
  fileTypeProgress(type: string, status: 'start' | 'complete' | 'skip', reason?: string): void {
    switch (status) {
      case 'start':
        this.debug(`Generating ${type} schemas...`);
        break;
      case 'complete':
        this.debug(`✓ Completed ${type} schema generation`);
        break;
      case 'skip':
        this.debug(`⏭️  Skipped ${type} schemas${reason ? `: ${reason}` : ''}`);
        break;
    }
  }

  /**
   * Log directory creation
   */
  directoryCreation(path: string, strategy: string): void {
    this.debug(`📁 Creating directory: ${path} (strategy: ${strategy})`);
  }

  /**
   * Log configuration summary
   */
  configSummary(summary: {
    strategy: string;
    directoryStrategy: string;
    enabledTypes: string[];
    outputPath: string;
  }): void {
    this.info(`Configuration: ${summary.strategy} strategy, ${summary.directoryStrategy} directories`);
    this.debug(`Output: ${summary.outputPath}`);
    this.debug(`Types: ${summary.enabledTypes.join(', ')}`);
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, details?: any): void {
    if (this.config.debug) {
      const message = `⏱️  ${operation}: ${duration}ms`;
      this.debug(message, details);
    }
  }

  /**
   * Create a timer for performance tracking
   */
  timer(operation: string): () => void {
    const start = Date.now();
    this.debug(`⏱️  Starting: ${operation}`);
    
    return () => {
      const duration = Date.now() - start;
      this.performance(operation, duration);
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString().substring(11, 23);
    const fullMessage = `${this.config.prefix} [${timestamp}] ${message}`;

    switch (level) {
      case 'debug':
      case 'info':
        console.log(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
    }

    if (data !== undefined && this.config.debug) {
      console.log('📊 Data:', data);
    }
  }
}

// Global logger instance
export const logger = new Logger();

/**
 * Create a scoped logger with additional context
 */
export function createScopedLogger(scope: string, config?: LoggerConfig): Logger {
  return new Logger({
    ...config,
    prefix: `🔧 Prisma Joi Generator [${scope}]`,
  });
}