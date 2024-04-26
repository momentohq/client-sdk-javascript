/* eslint-disable require-await */
/* eslint-disable @typescript-eslint/require-await */
import * as StoreGet from './store-get';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class StoreClient {
  public async createStore(storeName: string): Promise<void> {}
  public async deleteStore(storeName: string): Promise<void> {}
  public async listStores(): Promise<void> {}
  public async get(storeName: string, key: string): Promise<StoreGet.Response> {
    if (key === 'string-key') {
      return new StoreGet.StringValue('string-value');
    } else if (key === 'integer-key') {
      return new StoreGet.IntegerValue(42);
    } else if (key === 'boolean-key') {
      return new StoreGet.BooleanValue(true);
    } else {
      return new StoreGet.Error('Key not found');
    }
  }
  // public async put(storeName: string, key: string, value: string | number | boolean): Promise<void> {}
  // public async delete(storeName: string, key: string): Promise<void> {}
}
