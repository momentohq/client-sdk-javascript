import * as ResponseBase from './response-base';

export {Response, Error} from './response-base';

export class Success
  extends ResponseBase.Success
  implements ResponseBase.IListResponseSuccess
{
  private readonly _list_length: number;
  constructor(list_length: number) {
    super();
    this._list_length = list_length;
  }

  public listLength(): number {
    return this._list_length;
  }

  public override toString(): string {
    return `${super.toString()}: listLength: ${this._list_length}`;
  }
}
