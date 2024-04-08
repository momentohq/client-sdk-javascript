import {
  DefaultMomentoLoggerFactory,
  ICompression,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {loadZstdCompression} from './internal/compression/zstd-compression';

export class CompressorFactory {
  static default(loggerFactory?: MomentoLoggerFactory): ICompression {
    return loadZstdCompression(
      loggerFactory ?? new DefaultMomentoLoggerFactory()
    );
  }
}
