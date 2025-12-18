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
import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

const database: Map<string, string> = new Map();
database.set('test-key', 'test-value');

/* eslint-disable @typescript-eslint/no-unused-vars */
async function example_patterns_ReadAsideCaching(cacheClient: CacheClient): Promise<string> {
  const cachedValue = (await cacheClient.get('test-cache', 'test-key')).value();
  if (cachedValue !== undefined) {
    console.log(`Cache hit for key 'test-key': ${cachedValue}`);
    return cachedValue;
  } else {
    console.log("Key 'test-key' was not found in cache 'test-cache', checking in database...");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const actualValue = database.get('test-key')!;
    await cacheClient.set('test-cache', 'test-key', actualValue);
    return actualValue;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
async function example_patterns_WriteThroughCaching(cacheClient: CacheClient): Promise<string> {
  const value = 'test-value';
  database.set('test-key', value);
  await cacheClient.set('test-cache', 'test-key', value);
  return value;
}

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 60,
  });
  await cacheClient.createCache('test-cache');

  await example_patterns_ReadAsideCaching(cacheClient);
  await example_patterns_WriteThroughCaching(cacheClient);
}

main().catch(e => {
  throw e;
});
