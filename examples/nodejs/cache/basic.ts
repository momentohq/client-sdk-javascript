import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

async function main() {
  const momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await momento.createCache('cache');
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const promises = [];
  for (let i = 0; i < 10000; i++) {
    // Wrap each `momento.set` call in a function that logs the outcome.
    const promise = momento.set('cache', 'foo'.concat(String(i)), 'FOO')
      .then(response => {
        // Assuming the response can be directly checked to be an instance of CacheSet.Success or CacheSet.Error.
        if (response instanceof CacheSet.Error) {
          console.log(`Request ${i}: Error`, response);
        }
        return response; // Return response to keep the chain correct.
      })
      // If `momento.set` can reject, catch and log the rejection.
      .catch(error => {
        console.log(`Request ${i}: Failed with exception`, error);
        // Rethrow or return an error response to handle it in the outer Promise.all() resolution.
        throw error;
      });

    promises.push(promise);
  }

  // Wait for all promises to resolve or reject.
  await Promise.all(promises)
    .then(() => {
      console.log('All promises have been processed.');
    })
    .catch(error => {
      // This will catch any rejections that were re-thrown in the catch blocks above.
      console.log('One or more promises failed.', error);
    });

  const getResponse = await momento.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit: ${getResponse.valueString()}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
  }

  momento.close();
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
