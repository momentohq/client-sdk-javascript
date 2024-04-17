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

  /**
   * This property is used to set the default compression level for the client. The default value is `CompressionLevel.Balanced`.
   */
  compressionLevel?: CompressionLevel;

  /**
   * This property represents whether the SDK will decompress data returned by calls that support compression.
   */
  automaticDecompression: AutomaticDecompression;
}

export enum AutomaticDecompression {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}
