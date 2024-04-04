import {CompressionLevel} from '@gomomento/sdk-core';

export interface ICompression {
  compress(
    compression: CompressionLevel,
    value: Uint8Array
  ): Promise<Uint8Array>;

  decompressIfCompressed(value: Uint8Array): Promise<Uint8Array>;
}

/**
 * Configuration options for compressionLevel capabilities.
 */
export interface CompressionProps {
  /**
   * This property is used to register the compressionLevel extensions from the add-on library. To use this feature,
   * you will need to install the compressionLevel extensions library `@gomomento/sdk-nodejs-compressionLevel`, and then
   * import and call `CompressorFactory.default()`.
   */
  compressorFactory: ICompression;
}

// /**
//  * The mode of automatic decompression for calls to `CacheClient.get`.
//  */
// export enum AutomaticDecompression {
//   /**
//    * Automatic decompression is enabled; if a value retrieved via `CacheClient.get` is compressed, it will be automatically decompressed.
//    * @type {AutomaticDecompression.Enabled}
//    */
//   Enabled = 'Enabled',
//   /**
//    * Automatic decompression is disabled; if a value retrieved via `CacheClient.get` is compressed, it will be returned as-is.q
//    * @type {AutomaticDecompression.Disabled}
//    */
//   Disabled = 'Disabled',
// }
