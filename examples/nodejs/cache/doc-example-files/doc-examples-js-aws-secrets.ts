import {CacheClient, Configurations, CredentialProvider, CacheGet, CacheSet, CreateCache} from '@gomomento/sdk';

import {SecretsManagerClient, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';

/* A function that gets the Momento_Auth_Token stored in AWS Secrets Manager.
The secret was stored as a plaintext format in Secrets Manager to avoid parsing JSON.
You don't have to store the Momento auth token in something like AWS Secrets Manager,
but it is best practice. You could pass the Momento auth token in from an environment variable.
*/
async function getToken(secretName: string, regionName = 'us-west-2'): Promise<string> {
  try {
    const client = new SecretsManagerClient({region: regionName});
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: 'AWSCURRENT',
      })
    );
    return response.SecretString || '';
  } catch (error) {
    console.error(`Error fetching secret value for "${secretName}":`, (error as Error).message);
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }
}

// Function that calls to the GetToken function and then gets a client connection
// object from Momento Cache and returns that for later use.
async function createCacheClient(ttl = 600, tokenName = 'MOMENTO_AUTH_TOKEN'): Promise<CacheClient> {
  const token: string = await getToken(tokenName);
  return new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromString({authToken: token}),
    defaultTtlSeconds: ttl,
  });
}

// A function to create a cache
async function createCache(client: CacheClient, cacheName: string) {
  const result = await client.createCache(cacheName);
  if (result instanceof CreateCache.Success) {
    console.log(`Cache '${cacheName}' created`);
  } else if (result instanceof CreateCache.AlreadyExists) {
    console.log(`Cache '${cacheName}' already exists`);
  } else if (result instanceof CreateCache.Error) {
    throw new Error(
      `An error occurred while attempting to create cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
    );
  }
}

// A function to write to the cache
async function writeToCache(client: CacheClient, cacheName: string, key: string, data: string) {
  const setResponse = await client.set(cacheName, key, data);
  if (setResponse instanceof CacheSet.Success) {
    console.log('Key stored successfully!');
  } else if (setResponse instanceof CacheSet.Error) {
    console.log('Error setting key: ', setResponse.toString());
  } else {
    console.log('Some other error: ', setResponse.toString());
  }
}

// A function to read scalar items from the cache
async function readFromCache(client: CacheClient, cacheName: string, key: string) {
  const fileResponse = await client.get(cacheName, key);
  if (fileResponse instanceof CacheGet.Hit) {
    console.log('Cache hit: ', fileResponse.valueString());
  } else if (fileResponse instanceof CacheGet.Miss) {
    console.log('Cache miss');
  } else if (fileResponse instanceof CacheGet.Error) {
    console.log('Error: ', fileResponse.message());
  }
}

// Call the various functions
async function run() {
  // Defines name of cache to use.
  const CACHE_NAME = 'demo-cache2';
  const cacheClient = await createCacheClient();

  await createCache(cacheClient, CACHE_NAME);
  await writeToCache(cacheClient, CACHE_NAME, 'code', '12345');
  await readFromCache(cacheClient, CACHE_NAME, 'code');
}

run().catch(e => {
  throw e;
});
