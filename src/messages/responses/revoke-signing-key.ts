import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';

export abstract class Response extends ResponseBase {}

export class Success extends Response {}

export class Error extends Response {
  protected _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }
} // eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
