import * as ResponseBase from './response-base';

export {Response, Miss, Error} from './response-base';

export class Hit extends ResponseBase.Hit {
  private readonly _length: number;
  constructor(length: number) {
    super();
    this._length = length;
  }

  public length(): number {
    return this._length;
  }

  public override toString(): string {
    return `${super.toString()}: length ${this._length}`;
  }
}
