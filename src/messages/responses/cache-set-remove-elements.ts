import * as SimpleSuccess from './response-simple-success';
import * as CacheSetRemoveElement from './cache-set-remove-element';

export abstract class Response extends SimpleSuccess.Response {
  abstract toSingularResponse(): CacheSetRemoveElement.Response;
}

export class Success extends SimpleSuccess.Success {
  toSingularResponse(): CacheSetRemoveElement.Response {
    return new CacheSetRemoveElement.Success();
  }
}

export class Error extends SimpleSuccess.Error {
  toSingularResponse(): CacheSetRemoveElement.Response {
    return new CacheSetRemoveElement.Error(this._innerException);
  }
}
