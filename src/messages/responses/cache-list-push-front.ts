import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';

export abstract class Response extends ResponseBase {}

export class Success extends Response {
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

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
