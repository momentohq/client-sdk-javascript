export interface MomentoLogger {
  error(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
  trace(msg: string, ...args: unknown[]): void;
}

export interface MomentoLoggerFactory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogger(loggerName: string | any): MomentoLogger;
}
