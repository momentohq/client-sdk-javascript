export class StorageClient {
  public async createStore(storeName: string): Promise<void> {}
  public async deleteStore(storeName: string): Promise<void> {}
  public async listStores(): Promise<void> {}
  public async get(key: string): Promise<void> {}
  public async put(key: string, value: string | number | bool): Promise<void> {}
  public async delete(key: string): Promise<void> {}
}
