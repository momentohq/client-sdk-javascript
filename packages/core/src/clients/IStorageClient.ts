import {
  CreateStore,
  ListStores,
  DeleteStore,
  StorageSet,
  StorageGet,
  StorageDelete,
} from '../index';

export interface IStorageClient {
  createStore(storeName: string): Promise<CreateStore.Response>;
  listStores(): Promise<ListStores.Response>;
  deleteStore(cache: string): Promise<DeleteStore.Response>;
  get(storeName: string, key: string): Promise<StorageGet.Response>;
  set(
    storeName: string,
    key: string,
    value: string | Uint8Array | number
  ): Promise<StorageSet.Response>;
  delete(storeName: string, key: string): Promise<StorageDelete.Response>;

  close(): void;
}
