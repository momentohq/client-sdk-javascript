import * as pino from 'pino';
import {MomentoLogger, MomentoLoggerFactory} from './momento-logger';

export class PinoMomentoLogger implements MomentoLogger {
  private readonly pinoLogger: pino.Logger;

  constructor(pinoLogger: pino.Logger) {
    this.pinoLogger = pinoLogger;
  }

  trace(msg: string, ...args: unknown[]): void {
    this.pinoLogger.trace(msg, ...args);
  }

  debug(msg: string, ...args: unknown[]): void {
    this.pinoLogger.debug(msg, ...args);
  }

  info(msg: string, ...args: unknown[]): void {
    this.pinoLogger.info(msg, ...args);
  }

  warn(msg: string, ...args: unknown[]): void {
    this.pinoLogger.warn(msg, ...args);
  }

  error(msg: string, ...args: unknown[]): void {
    this.pinoLogger.error(msg, ...args);
  }
}

const defaultPinoOptions: pino.LoggerOptions = {
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
};

export class PinoMomentoLoggerFactory implements MomentoLoggerFactory {
  private readonly pinoRootLogger: pino.Logger;
  constructor(
    optionsOrStream:
      | pino.LoggerOptions
      | pino.DestinationStream = defaultPinoOptions
  ) {
    this.pinoRootLogger = pino.pino(optionsOrStream);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogger(loggerName: string | any): MomentoLogger {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const loggerNameString: string =
      typeof loggerName === 'string' || loggerName instanceof String
        ? loggerName
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          loggerName.constructor.name;
    return this.pinoRootLogger.child({name: loggerNameString});
  }
}
