import {
  MomentoLogger,
  MomentoLoggerFactory,
  CompressionLevel,
  ICompression,
} from '@gomomento/sdk';
import {convert} from '@gomomento/sdk/dist/src/internal/utils';
import * as zlib from 'zlib';

class GzipCompressor implements ICompression {
  // The byte sequence that begins a gzip compressed data frame.
  // https://loc.gov/preservation/digital/formats/fdd/fdd000599.shtml#sign
  private static readonly MAGIC_NUMBER = 0x1f8b;

  private readonly logger;
  constructor(logger: MomentoLogger) {
    this.logger = logger;
  }

  async compress(
    compressionLevel: CompressionLevel,
    value: Uint8Array
  ): Promise<Uint8Array> {
    let level: number | undefined;
    switch (compressionLevel) {
      case CompressionLevel.Balanced:
        level = zlib.constants.Z_DEFAULT_COMPRESSION;
        break;
      case CompressionLevel.Fastest:
        level = zlib.constants.Z_BEST_SPEED;
        break;
      case CompressionLevel.SmallestSize:
        level = zlib.constants.Z_BEST_COMPRESSION;
        break;
    }

    const compressionPromise = new Promise<Uint8Array>((resolve, reject) => {
      zlib.gzip(Buffer.from(convert(value)), {level: level}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    const compressed = await compressionPromise;

    this.logger.trace('Compressed value: %s', compressed.toString());

    return compressed;
  }

  async decompressIfCompressed(value: Uint8Array): Promise<Uint8Array> {
    this.logger.trace('Attempting to decompress value');
    if (!this.isGzipCompressed(value)) {
      return Promise.resolve(value);
    }

    const buffer = Buffer.from(value);
    this.logger.trace('Buffer created');

    try {
      const decompressedPromise = new Promise<Uint8Array>((resolve, reject) => {
        zlib.gunzip(buffer, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      const decompressed = await decompressedPromise;
      this.logger.trace('Decompressed buffer');
      return decompressed;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`Failed to decompress buffer: ${e}`);
      return Promise.reject(e);
    }
  }

  private isGzipCompressed(data: Uint8Array): boolean {
    if (data.length < 2) {
      return false;
    }

    // Extract the first 2 bytes to compare.
    const firstTwoBytes = ((data[0] << 8) | data[1]) >>> 0;
    return firstTwoBytes === GzipCompressor.MAGIC_NUMBER;
  }
}

export function loadGzipCompression(
  loggerFactory: MomentoLoggerFactory
): ICompression {
  const logger = loggerFactory.getLogger('gzip-compression');
  logger.trace('Gzip-compression module loading compressor');
  return new GzipCompressor(logger);
}
