import { CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider } from '@gomomento/sdk';
import { build, Histogram } from 'hdr-histogram-js';

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
    console.log('Cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  // Initialize a histogram for recording latencies.
  const histogram: Histogram = build({
    lowestDiscernibleValue: 1,
    highestTrackableValue: 10000,
    numberOfSignificantValueDigits: 3
  });

  const promises = [];
  for (let i = 0; i < 10000; i++) {
    const startTime = process.hrtime.bigint(); // Start timing

    const promise = momento.set('cache', `foo${i}`, 'FOO')
      .then(response => {
        if (response instanceof CacheSet.Error) {
          console.log(`Request ${i}: Error`, response);
        }
      })
      .catch(error => {
        console.log(`Request ${i}: Failed with exception`, error);
        // Don't throw error here to ensure latency recording
      })
      .finally(() => {
        const endTime = process.hrtime.bigint(); // End timing
        const latency = Number((endTime - startTime) / BigInt(1000000)); // Convert to milliseconds
        histogram.recordValue(latency); // Record latency regardless of promise outcome
      });

    promises.push(promise);
  }

  await Promise.all(promises)
    .then(() => {
      console.log('All promises have been processed.');
    })
    .finally(() => {
      // Log computed statistics after all promises, including failed ones, have been processed.
      console.log(`Latency p50: ${histogram.getValueAtPercentile(50)} ms`);
      console.log(`Latency p90: ${histogram.getValueAtPercentile(90)} ms`);
      console.log(`Latency p99: ${histogram.getValueAtPercentile(99)} ms`);
      console.log(`Latency p100: ${histogram.getValueAtPercentile(100)} ms`);
    });

  momento.close();
}

main()
  .then(() => {
    console.log('Success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
