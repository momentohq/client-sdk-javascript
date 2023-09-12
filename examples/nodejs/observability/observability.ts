// The trace auto-generation and metrics are set up here:
import {example_observability_setupMetrics, example_observability_setupTracing} from './utils/instrumentation';
example_observability_setupTracing();
example_observability_setupMetrics();
// Note that these must run before anything else to properly instrument the gRPC calls and
// configure OpenTelemetry to send metrics to Prometheus and traces to Zipkin.

import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
import {ExampleMetricMiddleware} from './example-metric-middleware';
import {uuid} from 'uuidv4';

async function main() {
  const cache = 'cache';
  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1()
      // This is where the middleware that captures the request count metric is added.
      .addMiddleware(new ExampleMetricMiddleware()),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  console.log("Creating cache 'cache'");
  const createCacheResponse = await momento.createCache(cache);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  for (let i = 0; i < 100; i++) {
    const key = uuid();
    const value = uuid();
    console.log(`${i}: Storing key=${key}, value=${value}`);
    const setResponse = await momento.set(cache, key, value);
    if (setResponse instanceof CacheSet.Success) {
      console.log('Key stored successfully!');
    } else {
      console.log(`Error setting key: ${setResponse.toString()}`);
    }

    const getResponse = await momento.get(cache, key);
    if (getResponse instanceof CacheGet.Hit) {
      console.log(`cache hit: ${getResponse.valueString()}`);
    } else if (getResponse instanceof CacheGet.Miss) {
      console.log('cache miss');
    } else if (getResponse instanceof CacheGet.Error) {
      console.log(`Error: ${getResponse.message()}`);
    }
  }
}

main()
  .then(() => {
    console.log('Pausing for 5 seconds to let metrics flush');
    setTimeout(() => {
      console.log(
        'Success! Zipkin at http://localhost:9411 should contain traces for the cache creation, get, and set. ' +
          'Grafana at http://localhost:3000 (username: admin, password: grafana) should contain a dashboard showing ' +
          'the requests made to Momento.'
      );
    }, 5000);
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
