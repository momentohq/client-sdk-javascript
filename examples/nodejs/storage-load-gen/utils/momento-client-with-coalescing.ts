import {PreviewStorageClient, StorageGet, StoragePut} from '@gomomento/sdk';
import {RequestCoalescerContext} from './load-gen';

export interface GetAndPutOnlyClient {
  get(storeName: string, key: string): Promise<StorageGet.Response>;
  putString(storeName: string, key: string, value: string): Promise<StoragePut.Response>;
}

export class MomentoClientWrapperWithCoalescing {
  private readonly momentoClient: PreviewStorageClient;
  private readonly context: RequestCoalescerContext;
  private readonly getRequestMap: Map<string, Promise<StorageGet.Response>>;
  private readonly putRequestMap: Map<string, Promise<StoragePut.Response>>;

  constructor(client: PreviewStorageClient, context: RequestCoalescerContext) {
    this.momentoClient = client;
    this.context = context;
    this.getRequestMap = new Map<string, Promise<StorageGet.Response>>();
    this.putRequestMap = new Map<string, Promise<StoragePut.Response>>();
  }

  get(storeName: string, key: string): Promise<StorageGet.Response> {
    if (this.getRequestMap.has(key)) {
      this.context.numberOfGetRequestsCoalesced++;
      const mapResponse = this.getRequestMap.get(key);
      if (mapResponse !== undefined) {
        return mapResponse;
      }
    }
    const getPromise = this.momentoClient.get(storeName, key);
    this.getRequestMap.set(key, getPromise);
    return getPromise.finally(() => {
      this.getRequestMap.delete(key);
    });
  }

  putString(storeName: string, key: string, value: string): Promise<StoragePut.Response> {
    if (this.putRequestMap.has(key)) {
      this.context.numberOfSetRequestsCoalesced++;
      const mapResponse = this.putRequestMap.get(key);
      if (mapResponse !== undefined) {
        return mapResponse;
      }
    }
    const setPromise = this.momentoClient.putString(storeName, key, value);
    this.putRequestMap.set(key, setPromise);
    return setPromise.finally(() => {
      this.putRequestMap.delete(key);
    });
  }
}
