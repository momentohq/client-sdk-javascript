import {
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  FixedCountRetryStrategy,
  ListStoresResponse,
  MomentoLoggerFactory,
  PreviewStorageClient,
  StorageConfigurations,
} from '@gomomento/sdk';

async function main() {
  // You can customize your log level or provide your own logger factory to
  // integrate with your favorite logging framework
  const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.DEBUG);
  const logger = loggerFactory.getLogger('AdvancedStorageExample');

  // You can specify the logger factory and override the default RetryStrategy (FixedTimeoutRetryStrategy)
  const storageClient = new PreviewStorageClient({
    configuration: StorageConfigurations.Laptop.latest(loggerFactory).withRetryStrategy(
      new FixedCountRetryStrategy({
        loggerFactory: loggerFactory,
        maxAttempts: 3,
      })
    ),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });

  const response = await storageClient.listStores();
  switch (response.type) {
    case ListStoresResponse.Success:
      logger.info('Stores:', response.stores());
      break;
    case ListStoresResponse.Error:
      logger.error('Error listing stores:', response.innerException());
      break;
  }
}

main().catch(e => {
  console.error('An error occurred! ', e);
  throw e;
});
