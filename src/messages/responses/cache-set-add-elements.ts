import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';
import {SdkError} from '../../errors/errors';
import * as CacheSetAddElement from './cache-set-add-element';

export abstract class Response extends ResponseBase {
  abstract toSingularResponse(): CacheSetAddElement.Response;
}

class _Success extends Response {
  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Success();
  }
}
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }

  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Error(this._innerException);
  }
}
export class Error extends ResponseError(_Error) {}
