import {CacheInfo} from '../cache-info';
import {control} from '@gomomento/generated-types';
import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {
  applyMixins,
  ErrorBody,
  ErrorConstructor,
} from '../../errors/error-utils';

export abstract class Response extends ResponseBase {}

export class Success extends Response {
  private readonly nextToken: string | null;
  private readonly caches: CacheInfo[];
  constructor(result?: control.control_client._ListCachesResponse) {
    super();
    this.nextToken = result?.next_token || null;
    this.caches = [];
    result?.cache.forEach(cache =>
      this.caches.push(new CacheInfo(cache.cache_name))
    );
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

export class Error extends ErrorConstructor {
  protected _innerException: SdkError;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
