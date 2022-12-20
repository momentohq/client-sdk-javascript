import {CacheInfo} from '../cache-info';
import {control} from '@gomomento/generated-types';
import {MomentoErrorCode, SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';

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

export class Error extends Response {
  private readonly _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }

  public message(): string {
    return this._innerException.wrappedErrorMessage();
  }

  public innerException(): object {
    return this._innerException;
  }

  public errorCode(): MomentoErrorCode {
    return this._innerException.errorCode();
  }

  public override toString(): string {
    return super.toString() + ': ' + this.message();
  }
}
