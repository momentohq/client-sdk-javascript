import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors/errors';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
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
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {}
export class Error extends ResponseError(_Error) {
  constructor(public _innerException: SdkError) {
    super();
  }
}
