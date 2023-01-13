import {ResponseBase} from './response-base';
import {SdkError} from '../../errors/errors';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import {TextDecoder} from 'util';
import {cache} from '@gomomento/generated-types';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
  private readonly items: cache.cache_client._DictionaryFieldValuePair[];

  constructor(items: cache.cache_client._DictionaryFieldValuePair[]) {
    super();
    this.items = items;
  }

  public valueDictionaryArrayBufferArrayBuffer(): Map<Uint8Array, Uint8Array> {
    const valueDictionaryUint8ArrayUint8ArrayMap = new Map<
      Uint8Array,
      Uint8Array
    >();
    for (const item of this.items) {
      valueDictionaryUint8ArrayUint8ArrayMap.set(item.field, item.value);
    }
    return valueDictionaryUint8ArrayUint8ArrayMap;
  }

  public valueDictionaryStringString(): Map<string, string> {
    const valueDictionaryStringStringMap = new Map<string, string>();
    for (const item of this.items) {
      valueDictionaryStringStringMap.set(
        TEXT_DECODER.decode(item.field),
        TEXT_DECODER.decode(item.value)
      );
    }
    return valueDictionaryStringStringMap;
  }

  public valueDictionaryStringArrayBuffer(): Map<string, Uint8Array> {
    const valueDictionaryStringArrayBufferMap = new Map<string, Uint8Array>();
    for (const item of this.items) {
      valueDictionaryStringArrayBufferMap.set(
        TEXT_DECODER.decode(item.field),
        item.value
      );
    }
    return valueDictionaryStringArrayBufferMap;
  }
}

export class Miss extends Response {}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
