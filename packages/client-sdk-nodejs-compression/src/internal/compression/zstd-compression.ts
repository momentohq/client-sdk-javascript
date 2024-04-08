import {
  MomentoLogger,
  MomentoLoggerFactory,
  CompressionLevel,
  ICompression,
} from '@gomomento/sdk';
import * as zstd from '@mongodb-js/zstd';
import {convert} from '@gomomento/sdk/dist/src/internal/utils';

class ZtsdCompressor implements ICompression {
  private readonly logger;
  constructor(logger: MomentoLogger) {
    this.logger = logger;
  }

  async compress(
    compressionLevel: CompressionLevel,
    value: Uint8Array
  ): Promise<Uint8Array> {
    let level;
    switch (compressionLevel) {
      case CompressionLevel.Balanced:
        level = 3;
        break;
      case CompressionLevel.Fastest:
        level = 1;
        break;
      case CompressionLevel.SmallestSize:
        level = 9;
        break;
    }
    const compressed = await zstd.compress(Buffer.from(convert(value)), level);

    this.logger.trace('Compressed value: %s', compressed.toString());

    return compressed;
  }

  async decompressIfCompressed(value: Uint8Array): Promise<Uint8Array> {
    this.logger.trace('Attempting to decompress value');
    const buffer = Buffer.from(value);
    this.logger.trace('Buffer created');
    try {
      // TODO: check bytes to see if it is compressed before calling decompress
      const decompressed = await zstd.decompress(buffer);
      this.logger.trace('Decompressed buffer');
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
): ICompression {
  const logger = loggerFactory.getLogger('zstd-compression');
  logger.trace('Zstd-compression module loading compressor');
  return new ZtsdCompressor(logger);
}
