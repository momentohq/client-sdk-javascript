import * as CacheSetRemoveElement from './cache-set-remove-element';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors/errors';

class _Success extends ResponseBase {}

class _Error extends ResponseBase {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export abstract class Response extends ResponseBase {
  abstract toSingularResponse(): CacheSetRemoveElement.Response;
}

export class Success extends ResponseSuccess(_Success) {
  toSingularResponse(): CacheSetRemoveElement.Response {
    return new CacheSetRemoveElement.Success();
  }
}

export class Error extends ResponseError(_Error) {
  toSingularResponse(): CacheSetRemoveElement.Response {
    return new CacheSetRemoveElement.Error(this._innerException);
  }
}
