import {MomentoLogger, MomentoLoggerFactory} from './momento-logger';

export class NoopMomentoLogger implements MomentoLogger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(msg: string, ...args: unknown[]): void {
    // no-op
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(msg: string, ...args: unknown[]): void {
    // no-op
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(msg: string, ...args: unknown[]): void {
    // no-op
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trace(msg: string, ...args: unknown[]): void {
    // no-op
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(msg: string, ...args: unknown[]): void {
    // no-op
  }
}

export class NoopMomentoLoggerFactory implements MomentoLoggerFactory {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  getLogger(loggerName: string | any): MomentoLogger {
    return new NoopMomentoLogger();
  }
}
