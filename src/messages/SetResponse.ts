import {MomentoCacheResult} from './Result';

export class SetResponse {
  public readonly result: MomentoCacheResult;
  public readonly message: string;
  constructor(result: MomentoCacheResult, message: string) {
    this.result = result;
    this.message = message;
  }
}
