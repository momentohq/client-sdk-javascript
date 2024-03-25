import {
  CacheClient,
  Configurations,
  CredentialProvider,
  CacheGet,
  CacheSet
} from '@gomomento/sdk';
import Bottleneck from 'bottleneck';

async function main() {
  const momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  const limiter = new Bottleneck({
    maxConcurrent: 5, // Adjust based on your concurrency requirement
  });

  // Example keys and values for set operations
  const keyValuePairs = Array.from({ length: 10 }, (_, i) => ({ key: `key${i}`, value: `value${i}` }));

  // Schedule set operations
  const setPromises = keyValuePairs.map(({ key, value }) =>
    limiter.schedule(async () => {
      const response = await momento.set('cache', key, value);
      if (response instanceof CacheSet.Success) {
        console.log(`Set operation for key ${key} succeeded.`);
      } else if (response instanceof CacheSet.Error) {
        console.log(`Set operation for key ${key} failed: ${response.toString()}`);
      }
      return response;
    })
  );

  // Schedule get operations
  const getPromises = keyValuePairs.map(({ key }) =>
    limiter.schedule(async () => {
      const response = await momento.get('cache', key);
      if (response instanceof CacheGet.Hit) {
        console.log(`Get operation for key ${key} succeeded with value: ${response.valueString()}`);
      } else if (response instanceof CacheGet.Miss) {
        console.log(`Get operation for key ${key} resulted in a miss.`);
      } else if (response instanceof CacheGet.Error) {
        console.log(`Get operation for key ${key} failed: ${response.toString()}`);
      }
      return response;
    })
  );

  // Wait for all get operations to complete
  await Promise.all([limiter.schedule(async () => getPromises),
                    limiter.schedule(async () => setPromises)]);

  await momento.close();
  console.log('All set and get operations completed.');
}

main()
  .then(() => console.log('Success!!'))
  .catch((e: Error) => console.error(`Uncaught exception while running example: ${e.message}`));
