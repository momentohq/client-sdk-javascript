// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {cache} from '@gomomento/generated-types';
import grpcCache = cache.cache_client;
import {TextDecoder} from 'util';
import {SdkError, UnknownError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseHit,
  ResponseMiss,
  ResponseError,
} from './response-base';
import * as CacheDictionaryGetFieldResponse from './cache-dictionary-get-field';

const TEXT_DECODER = new TextDecoder();
type CacheDictionaryGetFieldResponseType =
  | CacheDictionaryGetFieldResponse.Hit
  | CacheDictionaryGetFieldResponse.Miss
  | CacheDictionaryGetFieldResponse.Error;

export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly items: grpcCache._DictionaryGetResponse._DictionaryGetResponsePart[];
  private readonly fields: Uint8Array[];
  public responses: CacheDictionaryGetFieldResponseType[] = [];

  constructor(
    items: grpcCache._DictionaryGetResponse._DictionaryGetResponsePart[],
    fields: Uint8Array[]
  ) {
    super();
    this.items = items;
    this.fields = fields;
    items.forEach((item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        this.responses.push(
          new CacheDictionaryGetFieldResponse.Hit(
            item.cache_body,
            fields[index]
          )
        );
      } else if (item.result === grpcCache.ECacheResult.Miss) {
        this.responses.push(
          new CacheDictionaryGetFieldResponse.Miss(fields[index])
        );
      } else {
        this.responses.push(
          new CacheDictionaryGetFieldResponse.Error(
            new UnknownError(item.result.toString()),
            fields[index]
          )
        );
      }
    });
  }

  public valueMapUint8ArrayUint8Array(): Map<Uint8Array, Uint8Array> {
    return this.items.reduce((acc, item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc.set(this.fields[index], item.cache_body);
      }
      return acc;
    }, new Map<Uint8Array, Uint8Array>());
  }

  public valueMapStringString(): Map<string, string> {
    return this.items.reduce((acc, item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc.set(
          TEXT_DECODER.decode(this.fields[index]),
          TEXT_DECODER.decode(item.cache_body)
        );
      }
      return acc;
    }, new Map<string, string>());
  }

  public valueMap(): Map<string, string> {
    return this.valueMapStringString();
  }

  public valueMapStringUint8Array(): Map<string, Uint8Array> {
    return this.items.reduce((acc, item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc.set(TEXT_DECODER.decode(this.fields[index]), item.cache_body);
      }
      return acc;
    }, new Map<string, Uint8Array>());
  }

  public valueRecordStringString(): Record<string, string> {
    return this.items.reduce<Record<string, string>>((acc, item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc[TEXT_DECODER.decode(this.fields[index])] = TEXT_DECODER.decode(
          item.cache_body
        );
      }
      return acc;
    }, {});
  }

  public valueRecord(): Record<string, string> {
    return this.valueRecordStringString();
  }

  public valueRecordStringUint8Array(): Record<string, Uint8Array> {
    return this.items.reduce<Record<string, Uint8Array>>((acc, item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        acc[TEXT_DECODER.decode(this.fields[index])] = item.cache_body;
      }
      return acc;
    }, {});
  }

  public override toString(): string {
    let stringRepresentation = '';
    this.valueMapStringString().forEach((value, key) => {
      const keyValue = `${key}: ${value}, `;
      stringRepresentation = stringRepresentation + keyValue;
    });
    return `${super.toString()}: valueDictionaryStringString: ${stringRepresentation.slice(
      0,
      -2
    )}`;
  }
}
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
