import {TextDecoder} from 'util';

export class SetResponse {
  public readonly message: string;
  public readonly value: Uint8Array;
  private textDecoder = new TextDecoder();
  constructor(message: string, value: Uint8Array) {
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
