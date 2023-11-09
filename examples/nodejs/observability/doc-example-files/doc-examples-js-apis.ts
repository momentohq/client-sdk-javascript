/**
 *
 * This file contains examples of consuming the JavaScript APIs, for use as examples
 * in the public dev docs.  Each function name that begins with `example_` is available
 * to the dev docs to inject into the code snippets widget for the specified API.
 *
 * These examples should all be JavaScript; we can add TypeScript-specific examples in
 * a second file in the future if desired.
 *
 */
import {
  CacheClient,
  Configurations,
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
} from '@gomomento/sdk';
import {ExampleMetricMiddleware} from '../example-metric-middleware';

function example_API_InstantiateCacheClientWithMiddleware() {
  new CacheClient({
    configuration: Configurations.Laptop.v1().addMiddleware(new ExampleMetricMiddleware()),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });
}

function example_observability_CreateLoggerFactory() {
  // Setting the level to ERROR means you will see error messages but
  // no trace, info, debug, or warning messages.
  const errorLoggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.ERROR);
  const errorLogger = errorLoggerFactory.getLogger('momento-error-logger');
  errorLogger.error('error in the code!');

  // Setting the level to DEBUG means you will see error, info, debug,
  // and warning messages but no trace messages.
  const debugLoggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.DEBUG);
  const debugLogger = debugLoggerFactory.getLogger('momento-debug-logger');
  debugLogger.debug('helpful debugging message');
}

function main() {
  example_API_InstantiateCacheClientWithMiddleware();
  example_observability_CreateLoggerFactory();
}

main();
