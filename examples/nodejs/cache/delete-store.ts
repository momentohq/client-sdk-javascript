import {
  CredentialProvider,
  DeleteStoreResponse,
  ListStoresResponse,
  PreviewStorageClient,
  StorageConfigurations,
} from '@gomomento/sdk';

async function main() {
  const storageClient = new PreviewStorageClient({
    configuration: StorageConfigurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });

  // list stores
  const listStoresResponse = await storageClient.listStores();

  switch (listStoresResponse.type) {
    case ListStoresResponse.Success: {
      const storeNames = listStoresResponse.stores().map(store => store.getName());
      for (const store of storeNames) {
        const deleteStoreResponse = await storageClient.deleteStore(store);
        if (deleteStoreResponse.type === DeleteStoreResponse.Success) {
          console.log(`Deleted store ${store}`);
        } else {
          console.error(`Error deleting store ${store}: ${deleteStoreResponse.message()}`);
        }
      }
      break;
    }
    case ListStoresResponse.Error: {
      console.error(`Error listing stores: ${listStoresResponse.message()}`);
    }
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
