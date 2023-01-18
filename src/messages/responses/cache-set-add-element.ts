import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors/errors';

export abstract class Response extends ResponseBase {}

class _Success extends Response {}
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
