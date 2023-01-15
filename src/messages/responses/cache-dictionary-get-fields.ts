// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {cache} from '@gomomento/generated-types';
import grpcCache = cache.cache_client;
import {TextDecoder} from 'util';
import {SdkError, UnknownError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import * as CacheDictionaryGetFieldResponse from './cache-dictionary-get-field';

const TEXT_DECODER = new TextDecoder();
type CacheDictionaryGetFieldResponseType =
  | CacheDictionaryGetFieldResponse.Hit
  | CacheDictionaryGetFieldResponse.Miss
  | CacheDictionaryGetFieldResponse.Error;

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
  private readonly items: grpcCache._DictionaryGetResponse._DictionaryGetResponsePart[];
  private readonly fields: Uint8Array[];
  private readonly dictionaryUint8ArrayUint8Array: Map<Uint8Array, Uint8Array> =
    new Map();
  private readonly dictionaryStringString: Map<string, string> = new Map();
  private readonly dictionaryStringUint8Array: Map<string, Uint8Array> =
    new Map();
  public responsesList: CacheDictionaryGetFieldResponseType[] = [];

  constructor(
    items: grpcCache._DictionaryGetResponse._DictionaryGetResponsePart[],
    fields: Uint8Array[]
  ) {
    super();
    this.items = items;
    this.fields = fields;
    items.forEach((item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        this.responsesList.push(
          new CacheDictionaryGetFieldResponse.Hit(
            item.cache_body,
            fields[index]
          )
        );
      } else if (item.result === grpcCache.ECacheResult.Miss) {
        this.responsesList.push(
          new CacheDictionaryGetFieldResponse.Miss(fields[index])
        );
      } else {
        this.responsesList.push(
          new CacheDictionaryGetFieldResponse.Error(
            new UnknownError(item.result.toString()),
            fields[index]
          )
        );
      }
    });
  }

  public valueDictionaryUint8ArrayUint8Array(): Map<Uint8Array, Uint8Array> {
    this.items.forEach((item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        this.dictionaryUint8ArrayUint8Array.set(
          this.fields[index],
          item.cache_body
        );
      }
    });
    return this.dictionaryUint8ArrayUint8Array;
  }

  public valueDictionaryStringString(): Map<string, string> {
    this.items.forEach((item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        this.dictionaryStringString.set(
          TEXT_DECODER.decode(this.fields[index]),
          TEXT_DECODER.decode(item.cache_body)
        );
      }
    });
    return this.dictionaryStringString;
  }

  public valueDictionaryStringUint8Array(): Map<string, Uint8Array> {
    this.items.forEach((item, index) => {
      if (item.result === grpcCache.ECacheResult.Hit) {
        this.dictionaryStringUint8Array.set(
          TEXT_DECODER.decode(this.fields[index]),
          item.cache_body
        );
      }
    });
    return this.dictionaryStringUint8Array;
  }

  public override toString(): string {
    const stringRepresentation = Object.keys(this.valueDictionaryStringString())
      .map(
        key => `${key}: ${this.dictionaryStringString.get(key) || 'undefined'}`
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
