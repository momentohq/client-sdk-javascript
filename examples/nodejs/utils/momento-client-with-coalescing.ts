import {CacheClient, CacheGet, CacheSet} from '@gomomento/sdk';
import {RequestCoalescerContext} from './load-gen';

export interface GetAndSetOnlyClient {
  get(cacheName: string, key: string): Promise<CacheGet.Response>;
  set(cacheName: string, key: string, value: string): Promise<CacheSet.Response>;
}

export class MomentoClientWrapperWithCoalescing {
  private readonly momentoClient: CacheClient;
  private readonly context: RequestCoalescerContext;
  private readonly getRequestMap: Map<string, Promise<CacheGet.Response>>;
  private readonly setRequestMap: Map<string, Promise<CacheSet.Response>>;

  constructor(client: CacheClient, context: RequestCoalescerContext) {
    this.momentoClient = client;
    this.context = context;
    this.getRequestMap = new Map<string, Promise<CacheGet.Response>>();
    this.setRequestMap = new Map<string, Promise<CacheSet.Response>>();
  }

  get(cacheName: string, key: string): Promise<CacheGet.Response> {
    if (this.getRequestMap.has(key)) {
      this.context.numberOfGetRequestsCoalesced++;
      const mapResponse = this.getRequestMap.get(key);
      if (mapResponse !== undefined) {
        return mapResponse;
      }
    }
    const getPromise = this.momentoClient.get(cacheName, key);
    this.getRequestMap.set(key, getPromise);
    return getPromise.finally(() => {
      this.getRequestMap.delete(key);
    });
  }

  set(cacheName: string, key: string, value: string): Promise<CacheSet.Response> {
    if (this.setRequestMap.has(key)) {
      this.context.numberOfSetRequestsCoalesced++;
      const mapResponse = this.setRequestMap.get(key);
      if (mapResponse !== undefined) {
        return mapResponse;
      }
    }
    const setPromise = this.momentoClient.set(cacheName, key, value);
    this.setRequestMap.set(key, setPromise);
    return setPromise.finally(() => {
      this.setRequestMap.delete(key);
    });
  }
}
