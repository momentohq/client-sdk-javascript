import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors/errors';
import * as CacheSetRemoveElement from './cache-set-remove-element';

export abstract class Response extends ResponseBase {
  abstract toSingularResponse(): CacheSetRemoveElement.Response;
}

class _Success extends Response {
  toSingularResponse(): CacheSetRemoveElement.Response {
    return new CacheSetRemoveElement.Success();
  }
}
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }

  toSingularResponse(): CacheSetRemoveElement.Response {
    return new CacheSetRemoveElement.Error(this._innerException);
  }
}
export class Error extends ResponseError(_Error) {}
