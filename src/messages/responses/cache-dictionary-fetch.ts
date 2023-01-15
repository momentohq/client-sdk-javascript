import {ResponseBase} from './response-base';
import {SdkError} from '../../errors/errors';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import {TextDecoder} from 'util';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
  private readonly items: cache_client._DictionaryFieldValuePair[];
  private readonly dictionaryUint8ArrayUint8Array: Map<Uint8Array, Uint8Array> =
    new Map();
  private readonly dictionaryStringString: Map<string, string> = new Map();
  private readonly dictionaryStringArrayBuffer: Map<string, Uint8Array> =
    new Map();

  constructor(items: cache_client._DictionaryFieldValuePair[]) {
    super();
    this.items = items;
  }

  public valueDictionaryUint8ArrayUint8Array(): Map<Uint8Array, Uint8Array> {
    for (const item of this.items) {
      this.dictionaryUint8ArrayUint8Array.set(item.field, item.value);
    }
    return this.dictionaryUint8ArrayUint8Array;
  }

  public valueDictionaryStringString(): Map<string, string> {
    for (const item of this.items) {
      this.dictionaryStringString.set(
        TEXT_DECODER.decode(item.field),
        TEXT_DECODER.decode(item.value)
      );
    }
    return this.dictionaryStringString;
  }

  public valueDictionaryStringUint8Array(): Map<string, Uint8Array> {
    for (const item of this.items) {
      this.dictionaryStringArrayBuffer.set(
        TEXT_DECODER.decode(item.field),
        item.value
      );
    }
    return this.dictionaryStringArrayBuffer;
  }

  public override toString(): string {
    let stringRepresentation = '';
    this.valueDictionaryStringString().forEach((value, key) => {
      const keyValue = `${key}: ${value}, `;
      stringRepresentation = stringRepresentation + keyValue;
    });
    return `${super.toString()}: valueDictionaryStringString: ${stringRepresentation.slice(
      0,
      -2
    )}`;
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
