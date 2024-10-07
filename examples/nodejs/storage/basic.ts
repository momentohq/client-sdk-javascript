import {CreateStoreResponse, PreviewStorageClient, StorageGetResponse, StoragePutResponse} from '@gomomento/sdk';

async function main() {
  const storageClient = new PreviewStorageClient();

  const storeName = 'my-store';
  const createStoreResponse = await storageClient.createStore(storeName);
  switch (createStoreResponse.type) {
    case CreateStoreResponse.AlreadyExists:
      console.log(`Store '${storeName}' already exists`);
      break;
    case CreateStoreResponse.Success:
      console.log(`Store '${storeName}' created`);
      break;
    case CreateStoreResponse.Error:
      throw new Error(
        `An error occurred while attempting to create store '${storeName}': ${createStoreResponse.errorCode()}: ${createStoreResponse.toString()}`
      );
  }

  const putResponse = await storageClient.putString(storeName, 'test-key', 'test-value');
  switch (putResponse.type) {
    case StoragePutResponse.Success:
      console.log("Key 'test-key' stored successfully");
      break;
    case StoragePutResponse.Error:
      throw new Error(
        `An error occurred while attempting to store key 'test-key' in store '${storeName}': ${putResponse.errorCode()}: ${putResponse.toString()}`
      );
  }

  const getResponse = await storageClient.get(storeName, 'test-key');
  // simplified style; assume the value was found, and that it was a string
  console.log(`string hit: ${getResponse.value()!.string()!}`);

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

main().catch(e => {
  console.error('An error occurred! ', e);
  throw e;
});
