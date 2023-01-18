// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  public valueNumber(): number {
    return this.value;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueNumber()}`;
  }
}
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
