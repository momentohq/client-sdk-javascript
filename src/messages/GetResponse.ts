// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextDecoder} from 'util';
import {CacheGetStatus} from './Result';

export class GetResponse {
  public readonly status: CacheGetStatus;
  private readonly message: string;
  private readonly body: Uint8Array;
  private textDecoder = new TextDecoder();
  constructor(result: CacheGetStatus, message: string, body: Uint8Array) {
    this.status = result;
    this.message = message;
    this.body = body;
  }

  /**
   * decodes the body into a utf-8 string
   * @returns string|null
   */
  public text(): string | null {
    if (this.status === CacheGetStatus.Miss) {
      return null;
    }
    return this.textDecoder.decode(this.body);
  }

  public bytes(): Uint8Array {
    return this.body;
  }
}
