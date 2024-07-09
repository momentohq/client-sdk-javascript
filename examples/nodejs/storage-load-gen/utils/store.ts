import {
  PreviewStorageClient,
  EnvMomentoTokenProvider,
  MomentoLogger,
  MomentoLoggerFactory,
  StorageConfigurations,
  CreateStoreResponse,
} from '@gomomento/sdk';

export function getStorageClient(loggerFactory: MomentoLoggerFactory, requestTimeoutMs: number): PreviewStorageClient {
  return new PreviewStorageClient({
    configuration: StorageConfigurations.Laptop.latest(loggerFactory).withClientTimeoutMillis(requestTimeoutMs),
    credentialProvider: new EnvMomentoTokenProvider({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
}

export async function createStore(
  momentoStorageClient: PreviewStorageClient,
  storeName: string,
  logger: MomentoLogger
) {
  const createResponse = await momentoStorageClient.createStore(storeName);
  switch (createResponse.type) {
    case CreateStoreResponse.Success:
      logger.info(`store '${storeName}' created successfully`);
      break;
    case CreateStoreResponse.AlreadyExists:
      logger.info(`store '${storeName}' already exists`);
      break;
    case CreateStoreResponse.Error:
      throw createResponse.innerException();
  }
}
