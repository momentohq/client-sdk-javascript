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
    const promise = redisClient.set('foo'.concat(String(i)), 'FOO')
      .then(result => {
        // Log success status or value, if necessary.
      })
      .catch(error => {
        // Log the error status here.
        console.error(`Error for key foo${i}:`, error);
      });

    promises.push(promise);
  }

  await Promise.all(promises)
    .then((results) => {
      console.log('All operations have been processed.');
    });

  // Once all operations are complete, close the Redis connection.
  await redisClient.quit();  // or redisClient.disconnect();
  console.log('Redis client disconnected, exiting...');
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((error) => {
    console.error(`Uncaught exception while running example: ${error.message}`);
    throw error;
  });
