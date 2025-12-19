// The trace auto-generation and metrics are set up here:
import {example_observability_setupMetrics, example_observability_setupTracing} from './utils/instrumentation';
example_observability_setupTracing();
example_observability_setupMetrics();
// Note that these must run before anything else to properly instrument the gRPC calls and
// configure OpenTelemetry to send metrics to Prometheus and traces to Zipkin.

import {CacheClient, Configurations, CreateCacheResponse, CacheSetResponse, CacheGetResponse} from '@gomomento/sdk';
import {ExampleMetricMiddleware} from './example-metric-middleware';
import {uuid} from 'uuidv4';

async function main() {
  const cache = 'cache';
  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1()
      // This is where the middleware that captures the request count metric is added.
      .addMiddleware(new ExampleMetricMiddleware()),
    defaultTtlSeconds: 60,
  });

  console.log("Creating cache 'cache'");
  const createCacheResponse = await momento.createCache(cache);
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }

  for (let i = 0; i < 100; i++) {
    const key = uuid();
    const value = uuid();
    console.log(`${i}: Storing key=${key}, value=${value}`);
    const setResponse = await momento.set(cache, key, value);
    switch (setResponse.type) {
      case CacheSetResponse.Success:
        console.log('Key stored successfully!');
        break;
      case CacheSetResponse.Error:
        console.log(`Error setting key: ${setResponse.toString()}`);
        break;
    }

    const getResponse = await momento.get(cache, key);
    switch (getResponse.type) {
      case CacheGetResponse.Miss:
        console.log('cache miss');
        break;
      case CacheGetResponse.Hit:
        console.log(`cache hit: ${getResponse.valueString()}`);
        break;
      case CacheGetResponse.Error:
        console.log(`Error: ${getResponse.message()}`);
        break;
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
