// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {CacheGetResponse} from './cache-get-response';

const TEXT_DECODER = new TextDecoder();

export class Hit extends CacheGetResponse {
  private readonly body: Uint8Array;
  constructor(body: Uint8Array) {
    super();
    this.body = body;
  }
  /**
   * decodes the body into a utf-8 string
   * @returns string
   */
  public valueString(): string {
    return TEXT_DECODER.decode(this.body);
  }

  public bytes(): Uint8Array {
    return this.body;
  }
}

export class Miss extends CacheGetResponse {}

export class Error extends CacheGetResponse {
  private readonly errorMessage: string;
  // TODO MOAR FIELDS
  constructor(message: string) {
    super();
    this.errorMessage = message;
  }

  public message(): string {
    return this.errorMessage;
  }
}
