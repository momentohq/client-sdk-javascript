import * as pino from 'pino';
import {
  TransportMultiOptions,
  TransportPipelineOptions,
  TransportSingleOptions,
} from 'pino';

export interface Logger {
  info(msg: string): void;
  debug(msg: string): void;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
}

export enum LogFormat {
  CONSOLE = 'console',
  JSON = 'json',
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
}

export function getLogger(name: string, options?: LoggerOptions): Logger {
  const loggerOptions = options ?? defaultLoggerOptions();
  return new PinoLogger(name, loggerOptions);
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

  info(msg: string): void {
    this._logger.info(msg);
  }

  debug(msg: string): void {
    this._logger.debug(msg);
  }
}

function defaultLoggerOptions(): LoggerOptions {
  return {
    level: LogLevel.INFO,
  };
}

function pinoLogLevelFromLogLevel(level: LogLevel): pino.LevelWithSilent {
  switch (level) {
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
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
