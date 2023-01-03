import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';

export abstract class Response extends ResponseBase {}

export class Success extends Response {}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
