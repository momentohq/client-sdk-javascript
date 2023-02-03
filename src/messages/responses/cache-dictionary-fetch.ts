import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import {SdkError} from '../../errors/errors';
import {TextDecoder} from 'util';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly items: cache_client._DictionaryFieldValuePair[];
  private readonly _displayListSizeLimit = 5;

  constructor(items: cache_client._DictionaryFieldValuePair[]) {
    super();
    this.items = items;
  }

  public valueMap(): Map<string, string> {
    return this.valueMapStringString();
  }

  public valueMapUint8ArrayUint8Array(): Map<Uint8Array, Uint8Array> {
    return this.items.reduce((acc, item) => {
      acc.set(item.field, item.value);
      return acc;
    }, new Map<Uint8Array, Uint8Array>());
  }

  public valueMapStringString(): Map<string, string> {
    return this.items.reduce((acc, item) => {
      acc.set(TEXT_DECODER.decode(item.field), TEXT_DECODER.decode(item.value));
      return acc;
    }, new Map<string, string>());
  }

  public valueMapStringUint8Array(): Map<string, Uint8Array> {
    return this.items.reduce((acc, item) => {
      acc.set(TEXT_DECODER.decode(item.field), item.value);
      return acc;
    }, new Map<string, Uint8Array>());
  }

  public valueRecord(): Record<string, string> {
    return this.valueRecordStringString();
  }

  public valueRecordStringString(): Record<string, string> {
    return this.items.reduce<Record<string, string>>((acc, item) => {
      acc[TEXT_DECODER.decode(item.field)] = TEXT_DECODER.decode(item.value);
      return acc;
    }, {});
  }

  public valueRecordStringUint8Array(): Record<string, Uint8Array> {
    return this.items.reduce<Record<string, Uint8Array>>((acc, item) => {
      acc[TEXT_DECODER.decode(item.field)] = item.value;
      return acc;
    }, {});
  }

  private truncateValueStrings(): string {
    const keyValueIterable = this.valueMapStringString().entries();
    const keyValueArray = Array.from(keyValueIterable);
    if (keyValueArray.length <= this._displayListSizeLimit) {
      const pairs: string[] = [];
      keyValueArray.forEach(pair => {
        pairs.push(`${pair[0]}: ${pair[1]}`);
      });
      return pairs.join(',');
    } else {
      const slicedArray = keyValueArray.slice(0, this._displayListSizeLimit);
      const pairs: string[] = [];
      slicedArray.forEach(pair => {
        pairs.push(`${pair[0]}: ${pair[1]}`);
      });
      return pairs.join(',');
    }
  }

  public override toString(): string {
    return `${super.toString()}: valueDictionaryStringString: ${this.truncateValueStrings()}`;
  }
}
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
