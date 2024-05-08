import {
  DefaultMomentoLoggerFactory,
  ICompression,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {loadGzipCompression} from './internal/compression/gzip-compression';

export class CompressorFactory {
  static default(loggerFactory?: MomentoLoggerFactory): ICompression {
    return loadGzipCompression(
      loggerFactory ?? new DefaultMomentoLoggerFactory()
    );
  }
}
