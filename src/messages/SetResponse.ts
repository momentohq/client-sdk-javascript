import {MomentoCacheResult} from './Result';

export class SetResponse {
  public readonly result: MomentoCacheResult;
  public readonly message: string;
  public readonly value: string;
  constructor(result: MomentoCacheResult, message: string, value: string) {
    this.result = result;
    this.message = message;
    this.value = value;
  }

  /**
   * decodes the body into a utf-8 string
   * @returns string|null
   */
  public text(): string | null {
    if (this.result === MomentoCacheResult.Miss) {
      return null;
    }
    return this.value;
  }
}
