import {ListCachesResponse} from './list-caches-response';
import {CacheInfo} from '../../cache-info';
import {control} from '@gomomento/generated-types';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends ListCachesResponse {
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
}

export class Error extends ListCachesResponse {
  private readonly _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }

  public message(): string {
    // TODO: Add messageWrapper to the error classes
    return this._innerException.message;
  }

  public innerException(): object {
    return this._innerException;
  }

  public errorCode(): MomentoErrorCode {
    return this._innerException.errorCode;
  }

  public toString(): string {
    return this.message();
  }
}
