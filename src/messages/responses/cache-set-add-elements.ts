import * as ResponseBase from './response-base';
import * as CacheSetAddElement from './cache-set-add-element';

export abstract class Response extends ResponseBase.Response {
  abstract toSingularResponse(): CacheSetAddElement.Response;
}

export class Success extends ResponseBase.Success {
  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Success();
  }
}

export class Error extends ResponseBase.Error {
  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Error(this._innerException);
  }
}
