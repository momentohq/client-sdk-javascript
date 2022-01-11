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
   * returs value that is set in cache
   * @returns string|null
   */
  public text(): string | null {
    if (this.result === MomentoCacheResult.Miss) {
      return null;
    }
    return this.textDecoder.decode(this.value);
  }

  public bytes(): Uint8Array {
    return this.value;
  }
}
