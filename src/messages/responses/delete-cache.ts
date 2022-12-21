import {ResponseBase} from './response-base';
import {
  applyMixins,
  ErrorBody,
  ErrorConstructor,
} from '../../errors/error-utils';
import {SdkError} from '../../errors/errors';

export abstract class Response extends ResponseBase {}

export class Success extends Response {}

export class Error extends ErrorConstructor {
  protected _innerException: SdkError;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
