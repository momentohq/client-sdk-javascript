import {
  CreateStore,
  ListStores,
  DeleteStore,
  StoreSet,
  StoreGet,
  StoreDelete,
} from '../index';

export interface IStorageClient {
  createStore(storeName: string): Promise<CreateStore.Response>;
  listStores(): Promise<ListStores.Response>;
  deleteStore(cache: string): Promise<DeleteStore.Response>;
  get(storeName: string, key: string): Promise<StoreGet.Response>;
  set(
    storeName: string,
    key: string,
    value: string | Uint8Array | number
  ): Promise<StoreSet.Response>;
  delete(storeName: string, key: string): Promise<StoreDelete.Response>;

  close(): void;
}
