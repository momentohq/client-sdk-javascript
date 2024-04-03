import {CompressionMode} from '@gomomento/sdk-core';

export interface Compression {
  compress(
    compression: CompressionMode,
    value: Uint8Array
  ): Promise<Uint8Array>;

  decompressIfCompressed(value: Uint8Array): Promise<Uint8Array>;
}

export interface CompressionProps {
  compressionExtensions?: Compression;
  automaticDecompression: AutomaticDecompression;
}

export enum AutomaticDecompression {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}
