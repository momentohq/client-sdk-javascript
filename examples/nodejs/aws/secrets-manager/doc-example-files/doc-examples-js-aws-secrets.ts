import {
  CacheClient,
  Configurations,
  CredentialProvider,
  CreateCacheResponse,
  CacheSetResponse,
  CacheGetResponse,
} from '@gomomento/sdk';

import {SecretsManagerClient, GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';

async function example_API_retrieveApiKeyFromSecretsManager(
  ttl = 600,
  secretName = 'MOMENTO_API_KEY',
  regionName = 'us-west-2'
): Promise<CacheClient> {
  let secret;

  /* Try-catch block that gets the Momento_Auth_Token stored in AWS Secrets Manager.
  The secret was stored as a plaintext format in Secrets Manager to avoid parsing JSON.
  You don't have to store the Momento API key in something like AWS Secrets Manager,
  but it is best practice. You could pass the Momento API key in from an environment variable.
  */
  try {
    const client = new SecretsManagerClient({region: regionName});
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: 'AWSCURRENT',
      })
    );
    secret = response.SecretString || '';
  } catch (error) {
    console.error(`Error fetching secret value for "${secretName}":`, (error as Error).message);
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }

  // Gets a client connection object from Momento Cache and returns that for later use.
  return await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromString({apiKey: secret}),
    defaultTtlSeconds: ttl,
  });
}

// A function to create a cache
async function createCache(client: CacheClient, cacheName: string) {
  const result = await client.createCache(cacheName);
  switch (result.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log(`Cache '${cacheName}' already exists`);
      break;
    case CreateCacheResponse.Success:
      console.log(`Cache '${cacheName}' created`);
      break;
    case CreateCacheResponse.Error:
      throw new Error(
        `An error occurred while attempting to create cache '${cacheName}': ${result.errorCode()}: ${result.toString()}`
      );
  }
}

// A function to write to the cache
async function writeToCache(client: CacheClient, cacheName: string, key: string, data: string) {
  const setResponse = await client.set(cacheName, key, data);
  switch (setResponse.type) {
    case CacheSetResponse.Success:
      console.log('Key stored successfully!');
      break;
    case CacheSetResponse.Error:
      console.log('Error setting key: ', setResponse.toString());
      break;
  }
}

// A function to read scalar items from the cache
async function readFromCache(client: CacheClient, cacheName: string, key: string) {
  const fileResponse = await client.get(cacheName, key);
  switch (fileResponse.type) {
    case CacheGetResponse.Miss:
      console.log('Cache miss');
      break;
    case CacheGetResponse.Hit:
      console.log('Cache hit: ', fileResponse.valueString());
      break;
    case CacheGetResponse.Error:
      console.log('Error: ', fileResponse.message());
      break;
  }
}

// Call the various functions
async function main() {
  const CACHE_NAME = 'demo-cache2';
  const cacheClient = await example_API_retrieveApiKeyFromSecretsManager();

  await createCache(cacheClient, CACHE_NAME);
  await writeToCache(cacheClient, CACHE_NAME, 'code', '12345');
  await readFromCache(cacheClient, CACHE_NAME, 'code');
}

main().catch(e => {
  throw e;
});
