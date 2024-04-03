import {
  Compression,
  DefaultMomentoLoggerFactory,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {loadZstdCompression} from './internal/compression/zstd-compression';

export class CompressionExtensions {
  static load(loggerFactory?: MomentoLoggerFactory): Compression {
    return loadZstdCompression(
      loggerFactory ?? new DefaultMomentoLoggerFactory()
    );
  }
}
