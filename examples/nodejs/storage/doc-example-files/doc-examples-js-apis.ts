/**
 *
 * This file contains examples of consuming the JavaScript APIs, for use as examples
 * in the public dev docs.  Each function name that begins with `example_` is available
 * to the dev docs to inject into the code snippets widget for the specified API.
 *
 * These examples should all be JavaScript; we can add TypeScript-specific examples in
 * a second file in the future if desired.
 *
 */
import {
  CreateStoreResponse,
  CredentialProvider,
  DeleteStoreResponse,
  ListStoresResponse,
  PreviewStorageClient,
  StorageConfigurations,
  StorageDeleteResponse,
  StorageGetResponse,
  StoragePutResponse,
} from '@gomomento/sdk';
import * as crypto from 'crypto';

function example_API_Storage_InstantiateClient() {
  return new PreviewStorageClient({
    configuration: StorageConfigurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });
}

async function example_API_Storage_CreateStore(storageClient: PreviewStorageClient, storeName: string) {
  const result = await storageClient.createStore(storeName);
  switch (result.type) {
    case CreateStoreResponse.AlreadyExists:
      console.log(`Store '${storeName}' already exists`);
      break;
    case CreateStoreResponse.Success:
      console.log(`Store '${storeName}' created`);
      break;
    case CreateStoreResponse.Error:
      throw new Error(
        `An error occurred while attempting to create store '${storeName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_Storage_DeleteStore(storageClient: PreviewStorageClient, storeName: string) {
  const result = await storageClient.deleteStore(storeName);
  switch (result.type) {
    case DeleteStoreResponse.Success:
      console.log(`Store '${storeName}' deleted`);
      break;
    case DeleteStoreResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete store '${storeName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function example_API_Storage_ListStores(storageClient: PreviewStorageClient) {
  const result = await storageClient.listStores();
  switch (result.type) {
    case ListStoresResponse.Success:
      console.log(
        `Stores:\n${result
          .stores()
          .map(c => c.getName())
          .join('\n')}\n\n`
      );
      break;
    case ListStoresResponse.Error:
      throw new Error(`An error occurred while attempting to list stores: ${result.errorCode()}: ${result.toString()}`);
  }
}

async function example_API_Storage_Put(storageClient: PreviewStorageClient, storeName: string) {
  // to store a string value:
  const result = await storageClient.putString(storeName, 'test-key', 'test-value');
  switch (result.type) {
    case StoragePutResponse.Success:
      console.log("Key 'test-key' stored successfully");
      break;
    case StoragePutResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key 'test-key' in store '${storeName}': ${result.errorCode()}: ${result.toString()}`
      );
  }

  // Momento storage also supports these other data types:
  await storageClient.putInt(storeName, 'test-key', 42);
  await storageClient.putDouble(storeName, 'test-key', 3.14);
  await storageClient.putBytes(storeName, 'test-key', Buffer.from('test-value'));
}

async function example_API_Storage_Get(storageClient: PreviewStorageClient, storeName: string) {
  const getResponse = await storageClient.get(storeName, 'test-key');
  // simplified style; assume the value was found, and that it was a string
  console.log(`string hit: ${getResponse.value()!.string()!}`);

  // if the value was an integer:
  const integerGetResponse = await storageClient.get(storeName, 'test-integer-key');
  console.log(`integer hit: ${integerGetResponse.value()!.int()!}`);

  // pattern-matching style; safer for production code
  switch (getResponse.type) {
    case StorageGetResponse.Found:
      // if you know the value is a string:
      console.log(`Retrieved value for key 'test-key': ${getResponse.value().string()!}`);
      break;
    case StorageGetResponse.NotFound:
      console.log(`Key 'test-key' was not found in store '${storeName}'`);
      break;
    case StorageGetResponse.Error:
      throw new Error(
        `An error occurred while attempting to get key 'test-key' from store '${storeName}': ${getResponse.errorCode()}: ${getResponse.toString()}`
      );
  }
}

async function example_API_Storage_Delete(storageClient: PreviewStorageClient, storeName: string) {
  const result = await storageClient.delete(storeName, 'test-key');
  switch (result.type) {
    case StorageDeleteResponse.Success:
      console.log("Key 'test-key' deleted successfully");
      break;
    case StorageDeleteResponse.Error:
      throw new Error(
        `An error occurred while attempting to delete key 'test-key' from store '${storeName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

async function main() {
  example_API_Storage_InstantiateClient();

  const storageClient = new PreviewStorageClient({
    configuration: StorageConfigurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });

  const storeName = `js-sdk-doc-examples-store-${crypto.randomBytes(8).toString('hex')}`;

  await example_API_Storage_CreateStore(storageClient, storeName);

  try {
    await example_API_Storage_ListStores(storageClient);

    await example_API_Storage_Put(storageClient, storeName);
    await storageClient.putInt(storeName, 'test-integer-key', 42);
    await example_API_Storage_Get(storageClient, storeName);
    await example_API_Storage_Delete(storageClient, storeName);
  } finally {
    await example_API_Storage_DeleteStore(storageClient, storeName);
    storageClient.close();
  }
}

main().catch(e => {
  throw e;
});
