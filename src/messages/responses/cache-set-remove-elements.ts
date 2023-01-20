import * as SimpleSuccess from './response-simple-success';
import * as CacheSetAddElement from './cache-set-add-element';

export abstract class Response extends SimpleSuccess.Response {
  abstract toSingularResponse(): CacheSetAddElement.Response;
}

export class Success extends SimpleSuccess.Success {
  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Success();
  }
}

export class Error extends SimpleSuccess.Error {
  toSingularResponse(): CacheSetAddElement.Response {
    return new CacheSetAddElement.Error(this._innerException);
  }
}
