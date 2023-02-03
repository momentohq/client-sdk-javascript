import {PinoMomentoLoggerFactory} from './pino-momento-logger';

export enum DefaultMomentoLoggerLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class DefaultMomentoLoggerFactory extends PinoMomentoLoggerFactory {
  constructor(
    level: DefaultMomentoLoggerLevel = DefaultMomentoLoggerLevel.INFO
  ) {
    super({
      level: level.valueOf(),
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    });
  }
}
