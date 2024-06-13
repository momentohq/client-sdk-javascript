import {
  CreateStoreResponse,
  DeleteStoreResponse,
  IStorageClient,
  ListStoresResponse,
  StoreDeleteResponse,
  StoreGetResponse,
  StoreSetResponse,
} from '@gomomento/sdk-core';
import {testCacheName} from './common-int-test-utils';
import {v4} from 'uuid';

export function runStorageServiceTests(
  storageClient: IStorageClient,
  testStoreName: string
) {
  describe('#create list and delete stores', () => {
    it('creates a store, lists it and makes sure it exists, and then deletes it', async () => {
      const storeName = testCacheName();
      const createResponse = await storageClient.createStore(storeName);
      switch (createResponse.type) {
        // this is the expected response
        case CreateStoreResponse.Success: {
          break;
        }
        case CreateStoreResponse.AlreadyExists: {
          throw new Error(
            'store already exists, this should not happen in this test'
          );
        }
        case CreateStoreResponse.Error: {
          throw new Error(
            `failed to create store, expected store to be able to be created, error: ${createResponse.message()} exception: ${createResponse.toString()}`
          );
        }
      }

      const listResponse = await storageClient.listStores();
      switch (listResponse.type) {
        // this is expected response
        case ListStoresResponse.Success: {
          const foundStore = listResponse
            .getStores()
            .find(store => store.getName() === storeName);
          expect(foundStore).toBeDefined();
          break;
        }
        case ListStoresResponse.Error: {
          throw new Error(
            `failed to list stores: ${listResponse.message()} ${listResponse.toString()}`
          );
        }
      }

      const deleteResponse = await storageClient.deleteStore(storeName);
      switch (deleteResponse.type) {
        // w00t
        case DeleteStoreResponse.Success: {
          break;
        }
        case DeleteStoreResponse.Error: {
          throw new Error(
            `failed to delete store: ${deleteResponse.message()} ${deleteResponse.toString()}`
          );
        }
      }
    });
    it('should return AlreadyExists response if trying to create a store that already exists', async () => {
      const storeName = testCacheName();
      const createResponse = await storageClient.createStore(storeName);
      switch (createResponse.type) {
        // this is the expected response
        case CreateStoreResponse.Success: {
          break;
        }
        case CreateStoreResponse.AlreadyExists: {
          break;
        }
        case CreateStoreResponse.Error: {
          throw new Error(
            `failed to create store, expected store to be able to happen, error: ${createResponse.message()} exception: ${createResponse.toString()}`
          );
        }
      }
      const alreadyExistResponse = await storageClient.createStore(storeName);
      switch (alreadyExistResponse.type) {
        case CreateStoreResponse.AlreadyExists: {
          break;
        }
        case CreateStoreResponse.Error: {
          throw new Error(
            `failed to create store, expected AlreadyExists response, error: ${alreadyExistResponse.message()} exception: ${alreadyExistResponse.toString()}`
          );
        }
        case CreateStoreResponse.Success: {
          throw new Error(
            'store already exists, we should not be able to create it again'
          );
        }
      }
      await storageClient.deleteStore(storeName);
    });
  });
  describe('#store get set and delete', () => {
    it('set get and delete a key in a store', async () => {
      const key = v4();
      const value = v4();
      const setResponse = await storageClient.set(testStoreName, key, value);
      switch (setResponse.type) {
        case StoreSetResponse.Success: {
          break;
        }
        case StoreSetResponse.Error: {
          throw new Error(
            `failed to set key: ${setResponse.message()} ${setResponse.toString()}`
          );
        }
      }

      const getResponse = await storageClient.get(testStoreName, key);
      expect(getResponse.value()).toEqual(value);
      const deleteResponse = await storageClient.delete(testStoreName, key);
      switch (deleteResponse.type) {
        case StoreDeleteResponse.Success: {
          break;
        }
        case StoreDeleteResponse.Error: {
          throw new Error(
            `failed to delete key in store: ${deleteResponse.message()} ${deleteResponse.toString()}`
          );
        }
      }
    });
    it('should return miss for a key that doesnt exist', async () => {
      const key = v4();
      const getResponse = await storageClient.get(testStoreName, key);
      switch (getResponse.type) {
        case StoreGetResponse.Miss: {
          break;
        }
        default: {
          throw new Error(
            `expected StoreGetResponse.Miss but got ${
              getResponse.type
            } toString: ${getResponse.toString()}`
          );
        }
      }
    });
  });
}
