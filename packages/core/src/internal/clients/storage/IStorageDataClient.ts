import {StorageGet, StorageSet, StorageDelete} from '../../../index';

export interface IStorageDataClient {
  get(storeName: string, key: string): Promise<StorageGet.Response>;
  set(
    storeName: string,
    key: string,
    value: string | number | Uint8Array
  ): Promise<StorageSet.Response>;
  delete(storeName: string, key: string): Promise<StorageDelete.Response>;
  close(): void;
}
