import {CacheInfo} from '../cache-info';
import {control} from '@gomomento/generated-types';
import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly nextToken?: string;
  private readonly caches: CacheInfo[];
  constructor(result?: control.control_client._ListCachesResponse) {
    super();
    this.nextToken = result?.next_token;
    if (result) {
      this.caches = result.cache.map(cache => new CacheInfo(cache.cache_name));
    }
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getCaches() {
    return this.caches;
  }

  public override toString() {
    const caches = this.caches.map(cacheInfo => cacheInfo.getName());
    return super.toString() + ': ' + caches.join(', ');
  }
}
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
