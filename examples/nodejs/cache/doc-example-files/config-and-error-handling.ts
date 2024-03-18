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
import {CacheClient, Configurations, CredentialProvider, CacheGet, SdkError, MomentoErrorCode} from '@gomomento/sdk';

/* eslint-disable @typescript-eslint/no-unused-vars */
async function example_configuration_ConstructWithNoConfig() {
  const cacheClient = await CacheClient.create({
    credentialProvider: CredentialProvider.fromEnvVar('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unused-vars */
async function example_configuration_ConstructWithLambdaConfig() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromEnvVar('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });
}
/* eslint-enable @typescript-eslint/no-unused-vars */

async function example_configuration_ErrorHandlingHitMiss(cacheClient: CacheClient) {
  const result = await cacheClient.get('test-cache', 'test-key');
  if (result instanceof CacheGet.Hit) {
    console.log(`Retrieved value for key 'test-key': ${result.valueString()}`);
  } else if (result instanceof CacheGet.Miss) {
    console.log("Key 'test-key' was not found in cache 'test-cache'");
  } else if (result instanceof CacheGet.Error) {
    throw new Error(
      `An error occurred while attempting to get key 'test-key' from cache 'test-cache': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
async function example_configuration_ConstructWithThrowOnErrorsConfig() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest().withThrowOnErrors(true),
    credentialProvider: CredentialProvider.fromEnvVar('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });
}
/* eslint-enable @typescript-eslint/no-unused-vars */

async function example_configuration_SimplifiedGet(cacheClient: CacheClient) {
  const result = (await cacheClient.get('test-cache', 'test-key')).value();
  if (result !== undefined) {
    console.log(`Retrieved value for key 'test-key': ${result}`);
  } else {
    console.log("Key 'test-key' was not found in cache 'test-cache'");
  }
}

async function example_configuration_ErrorHandlingExceptionErrorCode(cacheClient: CacheClient) {
  try {
    const result = (await cacheClient.get('test-cache', 'test-key')).value();
    if (result !== undefined) {
      console.log(`Retrieved value for key 'test-key': ${result}`);
    } else {
      console.log("Key 'test-key' was not found in cache 'test-cache'");
    }
  } catch (e) {
    const momentoError = e as SdkError;
    if (momentoError.errorCode() === MomentoErrorCode.LIMIT_EXCEEDED_ERROR) {
      console.log('Request rate limit exceeded, may need to request a limit increase!');
    } else {
      throw new Error(
        `An error occurred while attempting to get key 'test-key' from cache 'test-cache': ${momentoError.errorCode()}: ${momentoError.toString()}`
      );
    }
  }
}

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });
  await cacheClient.createCache('test-cache');

  await example_configuration_ConstructWithNoConfig();
  await example_configuration_ConstructWithLambdaConfig();
  await example_configuration_SimplifiedGet(cacheClient);
  await example_configuration_ErrorHandlingHitMiss(cacheClient);
  await example_configuration_ConstructWithThrowOnErrorsConfig();

  const cacheClientWithThrowOnErrors = await CacheClient.create({
    configuration: Configurations.Lambda.latest().withThrowOnErrors(true),
    credentialProvider: CredentialProvider.fromEnvVar('MOMENTO_API_KEY'),
    defaultTtlSeconds: 60,
  });

  await example_configuration_ErrorHandlingExceptionErrorCode(cacheClientWithThrowOnErrors);
}

main().catch(e => {
  throw e;
});
