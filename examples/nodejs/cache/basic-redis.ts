import Redis from "ioredis";

// Define a type for the result of the Redis set operation for clarity.
// You might need to adjust this based on what you expect to receive.
type RedisSetResult = 'OK' | null;

// Utility function to enforce a timeout on a promise.
function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).then(result => {
    clearTimeout(timeoutHandle);
    return result;
  }).catch(error => {
    clearTimeout(timeoutHandle);
    throw error; // Rethrow error for further handling.
  });
}

async function main() {
  const redisClient = new Redis({
    host: 'raider-repro.tlghey.ng.0001.usw2.cache.amazonaws.com',
    port: 6379,
    connectTimeout: 1100,
    maxRetriesPerRequest: 0,
    retryStrategy: (times: number) => Math.min(times * 30, 1000),
    reconnectOnError: (error: Error) => {
      const targetErrors = [/READONLY/, /ETIMEDOUT/];
      return targetErrors.some((targetError) => targetError.test(error.message));
    }
  });

  redisClient.on('error', function (error: Error) {
    console.error('Redis client error:', error);
  });

  const promises: Promise<void>[] = [];
  for (let i = 10000; i < 20000; i++) {
    const promise = timeoutPromise(redisClient.set(`foo${i}`, 'FOO'), 1100)
      .then((result: RedisSetResult) => {
        // Success, no additional logging needed here.
      })
      .catch((error: Error) => {
        // This will catch both Redis errors and the timeout error.
        console.error(`Error for key foo${i}:`, error.message);
      });

    promises.push(promise);
  }

  await Promise.all(promises)
    .then(() => {
      console.log('All operations have been processed.');
    })
    .catch((error: Error) => {
      // This catch is for handling any errors that might occur in the Promise.all itself,
      // not for individual promises, as those are caught above.
      console.error('Error during processing:', error.message);
    });

  // Once all operations are complete, close the Redis connection.
  await redisClient.quit();
  console.log('Redis client disconnected, exiting...');
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((error: Error) => {
    console.error(`Uncaught exception while running main function: ${error.message}`);
  });
