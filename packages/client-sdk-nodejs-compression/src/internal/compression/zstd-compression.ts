import {
  MomentoLogger,
  MomentoLoggerFactory,
  CompressionLevel,
  ICompression,
} from '@gomomento/sdk';
import * as zstd from '@mongodb-js/zstd';
import {convert} from '@gomomento/sdk/dist/src/internal/utils';

class ZtsdCompressor implements ICompression {
  // The byte sequence that begins a ZSTD compressed data frame.
  // https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md
  private static readonly MAGIC_NUMBER = 0xfd2fb528;

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
    if (!this.isZstdCompressed(value)) {
      return Promise.resolve(value);
    }

    const buffer = Buffer.from(value);
    this.logger.trace('Buffer created');

    try {
      const decompressed = await zstd.decompress(buffer);
      this.logger.trace('Decompressed buffer');
      return decompressed;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`Failed to decompress buffer: ${e}`);
      return Promise.reject(e);
    }
  }

  private isZstdCompressed(data: Uint8Array): boolean {
    if (data.length < 4) {
      return false;
    }

    // Extract the first 4 bytes in little endian order to compare.
    const firstFourBytes =
      ((data[3] << 24) | (data[2] << 16) | (data[1] << 8) | data[0]) >>> 0;
    return firstFourBytes === ZtsdCompressor.MAGIC_NUMBER;
  }
}

export function loadZstdCompression(
  loggerFactory: MomentoLoggerFactory
): ICompression {
  const logger = loggerFactory.getLogger('zstd-compression');
  logger.trace('Zstd-compression module loading compressor');
  return new ZtsdCompressor(logger);
}
