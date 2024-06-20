import {
  CreateStoreResponse,
  DeleteStoreResponse,
  IStorageClient,
  ListStoresResponse,
  MomentoErrorCode,
  StorageDeleteResponse,
  StorageGetResponse,
  StoragePutResponse,
} from '@gomomento/sdk-core';
import {testStoreName} from './common-int-test-utils';
import {v4} from 'uuid';

export function runStorageServiceTests(
  storageClient: IStorageClient,
  testingStoreName: string
) {
  describe('#create list and delete stores', () => {
    it('creates a store, lists it and makes sure it exists, and then deletes it', async () => {
      const storeName = testStoreName();
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
        case ListStoresResponse.Success: {
          const storeNames = listResponse
            .stores()
            .map(store => store.getName());
          expect(storeNames).toContain(storeName);
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
      const storeName = testStoreName();
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
  describe('#store get put and delete', () => {
    it('put get and delete key in a store', async () => {
      const key = v4();
      const createResponse = await storageClient.createStore(testingStoreName);
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

      // put/get an int value
      const intValue = 42;
      const putIntResponse = await storageClient.putInt(
        testingStoreName,
        key,
        intValue
      );
      switch (putIntResponse.type) {
        case StoragePutResponse.Success: {
          break;
        }
        case StoragePutResponse.Error: {
          throw new Error(
            `failed to put key: ${putIntResponse.message()} ${putIntResponse.toString()}`
          );
        }
      }
      const getIntResponse = await storageClient.get(testingStoreName, key);
      expect(getIntResponse.type).toEqual(StorageGetResponse.Success);
      expect(getIntResponse.value()?.int()).toEqual(intValue);

      // put/get a double value
      const doubleValue = 42.42;
      const putDoubleResponse = await storageClient.putDouble(
        testingStoreName,
        key,
        doubleValue
      );
      switch (putDoubleResponse.type) {
        case StoragePutResponse.Success: {
          break;
        }
        case StoragePutResponse.Error: {
          throw new Error(
            `failed to put key: ${putDoubleResponse.message()} ${putDoubleResponse.toString()}`
          );
        }
      }
      const getDoubleResponse = await storageClient.get(testingStoreName, key);
      expect(getDoubleResponse.type).toEqual(StorageGetResponse.Success);
      expect(getDoubleResponse.value()?.double()).toEqual(doubleValue);

      // put/get a string value
      const stringValue = v4();
      const putStringResponse = await storageClient.putString(
        testingStoreName,
        key,
        stringValue
      );
      switch (putStringResponse.type) {
        case StoragePutResponse.Success: {
          break;
        }
        case StoragePutResponse.Error: {
          throw new Error(
            `failed to put key: ${putStringResponse.message()} ${putStringResponse.toString()}`
          );
        }
      }
      const getStringResponse = await storageClient.get(testingStoreName, key);
      expect(getStringResponse.type).toEqual(StorageGetResponse.Success);
      expect(getStringResponse.value()?.string()).toEqual(stringValue);

      // put/get a bytes value
      const bytesValue = new Uint8Array([1, 2, 3, 4]);
      const putBytesResponse = await storageClient.putBytes(
        testingStoreName,
        key,
        bytesValue
      );
      switch (putBytesResponse.type) {
        case StoragePutResponse.Success: {
          break;
        }
        case StoragePutResponse.Error: {
          throw new Error(
            `failed to put key: ${putBytesResponse.message()} ${putBytesResponse.toString()}`
          );
        }
      }
      const getBytesResponse = await storageClient.get(testingStoreName, key);
      expect(getBytesResponse.type).toEqual(StorageGetResponse.Success);
      expect(getBytesResponse.value()?.bytes()).toEqual(bytesValue);

      const deleteResponse = await storageClient.delete(testingStoreName, key);
      switch (deleteResponse.type) {
        case StorageDeleteResponse.Success: {
          break;
        }
        case StorageDeleteResponse.Error: {
          throw new Error(
            `failed to delete key in store: ${deleteResponse.message()} ${deleteResponse.toString()}`
          );
        }
      }
    });
    it('should return an undefined value for a key that doesnt exist', async () => {
      const key = v4();
      const createResponse = await storageClient.createStore(testingStoreName);
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
      const getResponse = await storageClient.get(testingStoreName, key);
      expect(getResponse.type).toEqual(StorageGetResponse.Success);
      expect(getResponse.value()).toBeUndefined();
    });
    it('should return store not found error for deleting a store that doesnt exist', async () => {
      const storeName = testStoreName();
      const deleteResponse = await storageClient.deleteStore(storeName);
      switch (deleteResponse.type) {
        case DeleteStoreResponse.Error: {
          expect(deleteResponse.errorCode()).toEqual(
            MomentoErrorCode.STORE_NOT_FOUND_ERROR
          );
          break;
        }
        default: {
          throw new Error(
            `expected StoreGetResponse.Error but got ${
              deleteResponse.type
            } toString: ${deleteResponse.toString()}`
          );
        }
      }
    });
  });
}
