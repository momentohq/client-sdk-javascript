import {CompressionMode} from '@gomomento/sdk-core';

export interface Compression {
  compress(
    compression: CompressionMode,
    value: Uint8Array
  ): Promise<Uint8Array>;

  decompressIfCompressed(value: Uint8Array): Promise<Uint8Array>;
}

/**
 * Configuration options for compression capabilities.
 */
export interface CompressionProps {
  /**
   * This property is used to register the compression extensions from the add-on library. To use this feature,
   * you will need to install the compression extensions library `@gomomento/sdk-nodejs-compression`, and then
   * import and call `CompressionExtensions.load()`.
   */
  compressionExtensions: Compression;
  /**
   * This property controls whether calls to `CacheClient.get` should automatically decompress the returned values.
   */
  automaticDecompression: AutomaticDecompression;
}

/**
 * The mode of automatic decompression for calls to `CacheClient.get`.
 */
export enum AutomaticDecompression {
  /**
   * Automatic decompression is enabled; if a value retrieved via `CacheClient.get` is compressed, it will be automatically decompressed.
   * @type {AutomaticDecompression.Enabled}
   */
  Enabled = 'Enabled',
  /**
   * Automatic decompression is disabled; if a value retrieved via `CacheClient.get` is compressed, it will be returned as-is.q
   * @type {AutomaticDecompression.Disabled}
   */
  Disabled = 'Disabled',
}
