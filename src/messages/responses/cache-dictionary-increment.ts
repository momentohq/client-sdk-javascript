// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';

export abstract class Response extends ResponseBase {}

export class Success extends Response {
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

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
