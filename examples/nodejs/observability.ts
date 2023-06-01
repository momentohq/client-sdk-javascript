// The trace auto-generation and metrics are set up here:
import {example_observability_setupMetrics, example_observability_setupTracing} from './utils/instrumentation';
example_observability_setupTracing();
example_observability_setupMetrics();
// Note that these must run before anything else to properly instrument the gRPC calls and
// configure OpenTelemetry to send metrics to Prometheus and traces to Zipkin.

import {CacheGet, CreateCache, CacheSet, CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
import {ExampleMetricMiddleware} from './doc-example-files/example-metric-middleware';

async function main() {
  const momento = new CacheClient({
    configuration: Configurations.Laptop.v1()
      // This is where the middleware that captures the request count metric is added.
      .addMiddleware(new ExampleMetricMiddleware()),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: 60,
  });

  console.log("Creating cache 'cache'");
  const createCacheResponse = await momento.createCache('cache');
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  console.log('Storing key=foo, value=FOO');
  const setResponse = await momento.set('cache', 'foo', 'FOO');
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully!');
  } else {
    console.log(`Error setting key: ${setResponse.toString()}`);
  }

  const getResponse = await momento.get('cache', 'foo');
  if (getResponse instanceof CacheGet.Hit) {
    console.log(`cache hit: ${getResponse.valueString()}`);
  } else if (getResponse instanceof CacheGet.Miss) {
    console.log('cache miss');
  } else if (getResponse instanceof CacheGet.Error) {
    console.log(`Error: ${getResponse.message()}`);
  }
}

main()
  .then(() => {
    console.log('Pausing for 5 seconds to let metrics flush');
    setTimeout(() => {
      console.log(
        'Success! Zipkin at http://localhost:9411 should contain traces for the cache creation, get, and set. ' +
          "Prometheus at http://localhost:9090 should contain a counter increment for the get and set under 'momento_requests_counter_total'."
      );
    }, 5000);
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
