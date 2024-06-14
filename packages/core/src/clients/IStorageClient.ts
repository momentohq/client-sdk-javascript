import {
  CreateStore,
  ListStores,
  DeleteStore,
  StoragePut,
  StorageGet,
  StorageDelete,
} from '../index';

export interface IStorageClient {
  createStore(storeName: string): Promise<CreateStore.Response>;
  listStores(): Promise<ListStores.Response>;
  deleteStore(cache: string): Promise<DeleteStore.Response>;
  get(storeName: string, key: string): Promise<StorageGet.Response>;
  put(
    storeName: string,
    key: string,
    value: string | Uint8Array | number
  ): Promise<StoragePut.Response>;
  delete(storeName: string, key: string): Promise<StorageDelete.Response>;

  close(): void;
}
