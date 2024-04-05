import {CompressionLevel} from '@gomomento/sdk-core';

export interface ICompression {
  compress(
    compressionLevel: CompressionLevel,
    value: Uint8Array
  ): Promise<Uint8Array>;

  decompressIfCompressed(value: Uint8Array): Promise<Uint8Array>;
}

/**
 * Configuration options for compression capabilities.
 */
export interface CompressionStrategy {
  /**
   * This property is used to register the compression factory from the add-on library. To use this feature,
   * you will need to install the compression extensions library `@gomomento/sdk-nodejs-compression`, and then
   * import and call `CompressorFactory.default()`.
   */
  compressorFactory: ICompression;
}
