import Redis from "ioredis";
import { build, Histogram } from "hdr-histogram-js";

type RedisSetResult = 'OK' | null;

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
    throw error;
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

  // Create a histogram for measuring latencies.
  const histogram: Histogram = build();

  const startTime = Date.now();
  const promises: Promise<void>[] = [];
  for (let i = 10000; i < 20000; i++) {
    const start = Date.now();
    const promise = timeoutPromise(redisClient.set(`foo${i}`, 'FOO'), 1100)
      .then((result: RedisSetResult) => {
        const latency = Date.now() - start; // Measure latency.
        histogram.recordValue(latency); // Record latency in the histogram.
      })
      .catch((error: Error) => {
        console.error(`Error for key foo${i}:`, error.message);
      });

    promises.push(promise);
  }

  await Promise.all(promises).then(() => {
    console.log('All operations have been processed.');
    const totalTime = Date.now() - startTime;
    console.log(`Total time for operations: ${totalTime} ms`);
  }).catch((error: Error) => {
    console.error('Error during processing:', error.message);
  });

  await redisClient.quit();
  console.log('Redis client disconnected, exiting...');

  // Log the histogram statistics.
  console.log(`P50 Latency: ${histogram.getValueAtPercentile(50)} ms`);
  console.log(`P90 Latency: ${histogram.getValueAtPercentile(90)} ms`);
  console.log(`P99 Latency: ${histogram.getValueAtPercentile(99)} ms`);
  console.log(`P100 Latency: ${histogram.getValueAtPercentile(100)} ms`);
}

main().then(() => {
  console.log('success!!');
}).catch((error: Error) => {
  console.error(`Uncaught exception while running main function: ${error.message}`);
});
