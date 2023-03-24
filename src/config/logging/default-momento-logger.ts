import {MomentoLogger, MomentoLoggerFactory} from './momento-logger';
import printf = require('../../internal/vendor/printf/printf');

export enum DefaultMomentoLoggerLevel {
  TRACE = 5,
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
}

export class DefaultMomentoLoggerFactory implements MomentoLoggerFactory {
  private readonly level: DefaultMomentoLoggerLevel;
  constructor(
    level: DefaultMomentoLoggerLevel = DefaultMomentoLoggerLevel.INFO
  ) {
    this.level = level;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogger(loggerName: string | any): MomentoLogger {
    return new DefaultMomentoLogger(loggerName, this.level);
  }
}

export class DefaultMomentoLogger implements MomentoLogger {
  private readonly loggerName: string;
  private readonly level: DefaultMomentoLoggerLevel;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(loggerName: string | any, level: DefaultMomentoLoggerLevel) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.loggerName =
      typeof loggerName === 'string' || loggerName instanceof String
        ? loggerName
        : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          loggerName.constructor.name;
    this.level = level;
  }

  trace(msg: string, ...args: unknown[]): void {
    if (this.level > DefaultMomentoLoggerLevel.TRACE) {
      return;
    }
    this.outputMessage(console.log, DefaultMomentoLoggerLevel.TRACE, msg, args);
  }

  debug(msg: string, ...args: unknown[]): void {
    if (this.level > DefaultMomentoLoggerLevel.DEBUG) {
      return;
    }
    this.outputMessage(console.log, DefaultMomentoLoggerLevel.DEBUG, msg, args);
  }

  info(msg: string, ...args: unknown[]): void {
    if (this.level > DefaultMomentoLoggerLevel.INFO) {
      return;
    }
    this.outputMessage(console.log, DefaultMomentoLoggerLevel.INFO, msg, args);
  }

  warn(msg: string, ...args: unknown[]): void {
    if (this.level > DefaultMomentoLoggerLevel.WARN) {
      return;
    }
    this.outputMessage(console.warn, DefaultMomentoLoggerLevel.WARN, msg, args);
  }

  error(msg: string, ...args: unknown[]): void {
    if (this.level > DefaultMomentoLoggerLevel.ERROR) {
      return;
    }
    this.outputMessage(
      console.error,
      DefaultMomentoLoggerLevel.ERROR,
      msg,
      args
    );
  }

  private outputMessage(
    outputFn: (output: string) => void,
    level: DefaultMomentoLoggerLevel,
    msg: string,
    args: unknown[]
  ) {
    outputFn(
      printf(
        '[%s] %s (Momento: %s): %s',
        new Date().toISOString(),
        DefaultMomentoLoggerLevel[level],
        this.loggerName,
        printf(msg, ...args)
      )
    );
  }
}
