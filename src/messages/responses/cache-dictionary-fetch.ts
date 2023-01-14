import {ResponseBase} from './response-base';
import {SdkError} from '../../errors/errors';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import {TextDecoder} from 'util';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
  private readonly items: cache_client._DictionaryFieldValuePair[];
  private readonly valueDictionaryUint8ArrayUint8ArrayMap = new Map<
    Uint8Array,
    Uint8Array
  >();
  private readonly valueDictionaryStringStringMap = new Map<string, string>();
  private readonly valueDictionaryStringArrayBufferMap = new Map<
    string,
    Uint8Array
  >();

  constructor(items: cache_client._DictionaryFieldValuePair[]) {
    super();
    this.items = items;
  }

  public valueDictionaryUint8ArrayUint8Array(): Map<Uint8Array, Uint8Array> {
    for (const item of this.items) {
      this.valueDictionaryUint8ArrayUint8ArrayMap.set(item.field, item.value);
    }
    return this.valueDictionaryUint8ArrayUint8ArrayMap;
  }

  public valueDictionaryStringString(): Map<string, string> {
    for (const item of this.items) {
      this.valueDictionaryStringStringMap.set(
        TEXT_DECODER.decode(item.field),
        TEXT_DECODER.decode(item.value)
      );
    }
    return this.valueDictionaryStringStringMap;
  }

  public valueDictionaryStringUint8Array(): Map<string, Uint8Array> {
    for (const item of this.items) {
      this.valueDictionaryStringArrayBufferMap.set(
        TEXT_DECODER.decode(item.field),
        item.value
      );
    }
    return this.valueDictionaryStringArrayBufferMap;
  }

  public override toString(): string {
    const stringRepresentation = Object.keys(
      this.valueDictionaryStringStringMap
    )
      .map(
        key =>
          `${key}: ${
            this.valueDictionaryStringStringMap.get(key) || 'undefined'
          }`
      )
      .join(', ');
    return `${super.toString()}: valueDictionaryStringString: ${stringRepresentation}`;
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
