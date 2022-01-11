import {MomentoCacheResult} from './Result';
import {TextDecoder} from 'util';

export class SetResponse {
  public readonly result: MomentoCacheResult;
  public readonly message: string;
  public readonly value: Uint8Array;
  private textDecoder = new TextDecoder();
  constructor(result: MomentoCacheResult, message: string, value: Uint8Array) {
    this.result = result;
    this.message = message;
    this.value = value;
  }

  /**
   * returns string value that is set in cache
   * @returns string
   */
  public text(): string {
    return this.textDecoder.decode(this.value);
  }

  /**
   * returns byte value that is set in cache
   * @returns Uint8Array
   */
  public bytes(): Uint8Array {
    return this.value;
  }
}
