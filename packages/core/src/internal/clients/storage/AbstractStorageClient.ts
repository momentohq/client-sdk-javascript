import {
  CreateStore,
  DeleteStore,
  ListStores,
  StorageGet,
  StoragePut,
  StorageDelete,
} from '../../../index';
import {IStorageDataClient} from './IStorageDataClient';
import {IStorageClient} from '../../../clients/IStorageClient';
import {IStorageControlClient} from './IStorageControlClient';

export abstract class AbstractStorageClient implements IStorageClient {
  protected readonly dataClients: IStorageDataClient[];
  protected readonly controlClient: IStorageControlClient;
  private nextDataClientIndex: number;

  protected constructor(
    dataClients: IStorageDataClient[],
    controlClient: IStorageControlClient
  ) {
    this.dataClients = dataClients;
    this.controlClient = controlClient;

    // We round-robin the requests through all of our clients.  Since javascript
    // is single-threaded, we don't have to worry about thread safety on this
    // index variable.
    this.nextDataClientIndex = 0;
  }

  createStore(storeName: string): Promise<CreateStore.Response> {
    return this.controlClient.createStore(storeName);
  }

  listStores(): Promise<ListStores.Response> {
    return this.controlClient.listStores();
  }

  deleteStore(storeName: string): Promise<DeleteStore.Response> {
    return this.controlClient.deleteStore(storeName);
  }

  get(storeName: string, key: string): Promise<StorageGet.Response> {
    return this.getNextDataClient().get(storeName, key);
  }

  putInt(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response> {
    return this.getNextDataClient().putInt(storeName, key, value);
  }

  putDouble(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response> {
    return this.getNextDataClient().putDouble(storeName, key, value);
  }

  putString(
    storeName: string,
    key: string,
    value: string
  ): Promise<StoragePut.Response> {
    return this.getNextDataClient().putString(storeName, key, value);
  }

  putBytes(
    storeName: string,
    key: string,
    value: Uint8Array
  ): Promise<StoragePut.Response> {
    return this.getNextDataClient().putBytes(storeName, key, value);
  }

  delete(storeName: string, key: string): Promise<StorageDelete.Response> {
    return this.getNextDataClient().delete(storeName, key);
  }

  private getNextDataClient(): IStorageDataClient {
    const client = this.dataClients[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.dataClients.length;
    return client;
  }

  abstract close(): void;
}
