import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

export abstract class Response extends ResponseBase {}

class _Success extends Response {}
export class Success extends ResponseSuccess(_Success) {}

export class AlreadyExists extends Response {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
