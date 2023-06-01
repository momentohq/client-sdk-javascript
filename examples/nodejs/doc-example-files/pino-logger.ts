/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk';
import * as pino from 'pino';

/**
 * An implementation of the MomentoLogger that just passes
 * through all of the logging calls to an underlying pino logger.
 */
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

/**
 * This factory object will be used by Momento when it needs to instantiate a logger.
 * Here we basically just pass through options to pino, get a pino logger, and then
 * wrap it with a Momento logger.
 */
export class PinoMomentoLoggerFactory implements MomentoLoggerFactory {
  private readonly pinoRootLogger: pino.Logger;
  constructor(optionsOrStream: pino.LoggerOptions | pino.DestinationStream = defaultPinoOptions) {
    this.pinoRootLogger = pino.pino(optionsOrStream);
  }

  getLogger(loggerName: string | any): MomentoLogger {
    const loggerNameString = loggerName.constructor.name;
    const pinoLogger = this.pinoRootLogger.child({name: loggerNameString});
    return new PinoMomentoLogger(pinoLogger);
  }
}
