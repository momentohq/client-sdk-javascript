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
  ERROR = 'error',
}

export enum LogFormat {
  CONSOLE = 'console',
  JSON = 'json',
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
}

interface InitializedLoggerOptions {
  level: LogLevel;
  format: LogFormat;
}

const _MOMENTO_LOGGING_OPTIONS: InitializedLoggerOptions = {
  level: LogLevel.WARN,
  format: LogFormat.JSON,
};

export function initializeMomentoLogging(options?: LoggerOptions) {
  if (options?.level !== undefined) {
    _MOMENTO_LOGGING_OPTIONS.level = options.level;
  }
  if (options?.format !== undefined) {
    _MOMENTO_LOGGING_OPTIONS.format = options.format;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLogger(caller: string | any): Logger {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const loggerName: string =
    typeof caller === 'string' || caller instanceof String
      ? caller
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        caller.constructor.name;
  return new PinoLogger(loggerName);
}

class PinoLogger implements Logger {
  private static _root_logger: pino.Logger;
  private readonly _logger: pino.Logger;

  constructor(name: string) {
    if (PinoLogger._root_logger === undefined) {
      const pinoLevel: pino.LevelWithSilent = pinoLogLevelFromLogLevel(
        _MOMENTO_LOGGING_OPTIONS.level
      );

      const transport = pinoTransportFromLogFormat(
        _MOMENTO_LOGGING_OPTIONS.format
      );

      PinoLogger._root_logger = pino.pino({
        level: pinoLevel,
        transport: transport,
      });
    }

    this._logger = PinoLogger._root_logger.child({name: name});
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
