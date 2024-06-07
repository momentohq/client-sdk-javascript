import {CreateStore, DeleteStore, ListStores} from '../../../index';

export interface IStorageControlClient {
  createStore(storeName: string): Promise<CreateStore.Response>;
  deleteStore(storeName: string): Promise<DeleteStore.Response>;
  listStores(): Promise<ListStores.Response>;
  close(): void;
}
