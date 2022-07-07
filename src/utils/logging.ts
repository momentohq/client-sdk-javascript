import * as pino from 'pino';
import {
  TransportMultiOptions,
  TransportPipelineOptions,
  TransportSingleOptions,
} from 'pino';

export interface Logger {
  error(msg: string): void;
  warn(msg: string): void;
  info(msg: string): void;
  debug(msg: string): void;
  trace(msg: string): void;
}

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum LogFormat {
  CONSOLE = 'console',
  JSON = 'json',
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
}

export function getLogger(caller: string | any, options?: LoggerOptions): Logger {
  const loggerOptions = options ?? defaultLoggerOptions();
  const loggerName = ((typeof caller === 'string') || (caller instanceof String))
    ? caller
    : caller.constructor.name;
  return new PinoLogger(loggerName, loggerOptions);
}

class PinoLogger implements Logger {
  private readonly _logger: pino.Logger;

  constructor(name: string, options: LoggerOptions) {
    const pinoLevel: pino.LevelWithSilent = pinoLogLevelFromLogLevel(
      options.level ?? LogLevel.INFO
    );

    const transport = pinoTransportFromLogFormat(
      options.format ?? LogFormat.CONSOLE
    );

    this._logger = pino.pino({
      name: name,
      level: pinoLevel,
      transport: transport,
    });
  }

  error(msg: string): void {
    this._logger.error(msg);
  }

  warn(msg: string): void {
    this._logger.warn(msg);
  }

  info(msg: string): void {
    this._logger.info(msg);
  }

  debug(msg: string): void {
    this._logger.debug(msg);
  }

  trace(msg: string): void {
    this._logger.trace(msg);
  }
}

function defaultLoggerOptions(): LoggerOptions {
  return {
    level: LogLevel.INFO,
  };
}

function pinoLogLevelFromLogLevel(level: LogLevel): pino.LevelWithSilent {
  switch (level) {
    case LogLevel.TRACE:
      return 'trace';
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
      return 'error';

    default:
      throw new Error(`Unsupported log level: ${String(level)}`);
  }
}

function pinoTransportFromLogFormat(
  format: LogFormat
):
  | undefined
  | TransportSingleOptions
  | TransportMultiOptions
  | TransportPipelineOptions {
  switch (format) {
    case LogFormat.CONSOLE:
      return {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      };
    case LogFormat.JSON:
      return undefined;
    default:
      throw new Error(`Unsupported log format: ${String(format)}`);
  }
}
