import Redis from "ioredis";

async function main() {

  const redisClient = new Redis({
    host: 'raider-repro-lbrd-tlghey.serverless.usw2.cache.amazonaws.com:6379',
    port: 6379,
    connectTimeout: 17000,
    maxRetriesPerRequest: 4,
    retryStrategy: (times) => Math.min(times * 30, 1000),
    reconnectOnError: (error)  => {
      const targetErrors = [/READONLY/, /ETIMEDOUT/];
      return targetErrors.some((targetError) => targetError.test(error.message));
    }
  });

  redisClient.on('error', function (error) {
    console.error(error);
  });

  const promises = [];
  for (let i = 0; i < 10000; i++) {
    promises.push(redisClient.set('foo'.concat(String(i)), 'FOO'));
  }
  await Promise.all(promises);

  // Wait for all promises to resolve or reject.
  await Promise.all(promises)
    .then(() => {
      console.log('All promises have been processed.');
    })
    .catch(error => {
      // This will catch any rejections that were re-thrown in the catch blocks above.
      console.log('One or more promises failed.', error);
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
