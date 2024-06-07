import {StoreGet, StoreSet, StoreDelete} from '../../../index';

export interface IStorageDataClient {
  get(storeName: string, key: string): Promise<StoreGet.Response>;
  set(
    storeName: string,
    key: string,
    value: string | number | Uint8Array
  ): Promise<StoreSet.Response>;
  delete(storeName: string, key: string): Promise<StoreDelete.Response>;
  close(): void;
}
