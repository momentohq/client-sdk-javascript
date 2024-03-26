import Redis from "ioredis";

async function main() {
  const redisClient = new Redis({
    host: 'raider-repro.tlghey.ng.0001.usw2.cache.amazonaws.com',
    port: 6379,
    connectTimeout: 17000,
    maxRetriesPerRequest: 4,
    retryStrategy: (times) => Math.min(times * 30, 1000),
    reconnectOnError: (error) => {
      const targetErrors = [/READONLY/, /ETIMEDOUT/];
      return targetErrors.some((targetError) => targetError.test(error.message));
    }
  });

  redisClient.on('error', function (error) {
    console.error('Redis client error:', error);
  });

  let promises = [];
  for (let i = 0; i < 10000; i++) {
    // Wrap each `redisClient.set` operation to individually handle its resolution and rejection.
    const promise = redisClient.set('foo'.concat(String(i)), 'FOO')
      .then(result => {
        // Log success status or value, if necessary.
        // console.log(`Success for key foo${i}:`, result);
      })
      .catch(error => {
        // Log the error status here.
        console.error(`Error for key foo${i}:`, error);
      });

    promises.push(promise);
  }

  // Use Promise.allSettled to wait for all promises to either resolve or reject.
  // This method allows handling of each promise's outcome individually.
  await Promise.all(promises)
    .then((results) => {
      // Optionally, process the results array if you need to perform any aggregated analysis.
      console.log('All operations have been processed.');
    });
}


main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
