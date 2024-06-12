import {SdkError} from '@gomomento/sdk-core';

export class CompressionError extends SdkError {
  override _messageWrapper = 'Compression Error';
  constructor(action: string, option: string) {
    super(
      `Compressor is not set, but \`${action}\` was called with the \`${option}\` option; please install @gomomento/sdk-nodejs-compression and call \`Configuration.withCompressionStrategy\` to enable compression.`
    );
  }
}
