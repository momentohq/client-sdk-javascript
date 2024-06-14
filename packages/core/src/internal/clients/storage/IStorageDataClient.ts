import {StorageGet, StoragePut, StorageDelete} from '../../../index';

export interface IStorageDataClient {
  get(storeName: string, key: string): Promise<StorageGet.Response>;
  put(
    storeName: string,
    key: string,
    value: string | number | Uint8Array
  ): Promise<StoragePut.Response>;
  delete(storeName: string, key: string): Promise<StorageDelete.Response>;
  close(): void;
}
