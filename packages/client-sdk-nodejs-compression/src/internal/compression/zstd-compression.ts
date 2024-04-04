import {
  MomentoLogger,
  MomentoLoggerFactory,
  CompressionMode,
  Compression,
} from '@gomomento/sdk';
import * as zstd from '@mongodb-js/zstd';
import {convert} from '@gomomento/sdk/dist/src/internal/utils';

class ZtsdCompressor implements Compression {
  private readonly logger;
  constructor(logger: MomentoLogger) {
    this.logger = logger;
  }

  async compress(
    compression: CompressionMode,
    value: Uint8Array
  ): Promise<Uint8Array> {
    let level;
    switch (compression) {
      case CompressionMode.Default:
        level = 3;
        break;
      case CompressionMode.Fast:
        level = 1;
        break;
      case CompressionMode.Smallest:
        level = 9;
        break;
    }
    const compressed = await zstd.compress(Buffer.from(convert(value)), level);

    this.logger.info(`Compressed value: ${compressed.toString()}`);

    return compressed;
  }

  async decompressIfCompressed(value: Uint8Array): Promise<Uint8Array> {
    this.logger.info('Attempting to decompress value');
    const buffer = Buffer.from(value);
    this.logger.info('Buffer created');
    try {
      // TODO: check bytes to see if it is compressed before calling decompress
      const decompressed = await zstd.decompress(buffer);
      this.logger.info('Decompressed buffer');
      return decompressed;
    } catch (e) {
      // TODO: once we have added the code to check the BOM bytes, we should change the following line to log at ERROR level.
      // TODO: and/or we might want to actually reject the promise here.
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`Failed to decompress buffer: ${e}`);
      // return Promise.reject(e);
      return Promise.resolve(value);
    }
  }
}

export function loadZstdCompression(
  loggerFactory: MomentoLoggerFactory
): Compression {
  const logger = loggerFactory.getLogger('zstd-compression');
  logger.info('Zstd-compression module loading compressor');
  return new ZtsdCompressor(logger);
}
