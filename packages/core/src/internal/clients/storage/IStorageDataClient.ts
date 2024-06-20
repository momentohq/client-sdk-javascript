import {StorageGet, StoragePut, StorageDelete} from '../../../index';

export interface IStorageDataClient {
  get(storeName: string, key: string): Promise<StorageGet.Response>;
  putInt(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response>;
  putDouble(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response>;
  putString(
    storeName: string,
    key: string,
    value: string
  ): Promise<StoragePut.Response>;
  putBytes(
    storeName: string,
    key: string,
    value: Uint8Array
  ): Promise<StoragePut.Response>;
  delete(storeName: string, key: string): Promise<StorageDelete.Response>;
  close(): void;
}
