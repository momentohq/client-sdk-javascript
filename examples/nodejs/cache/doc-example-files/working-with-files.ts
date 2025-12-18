import * as fs from 'node:fs';
import { CacheClient, CacheGetResponse, CacheSetResponse, Configurations, CredentialProvider } from '@gomomento/sdk';

const filePath = './myfile.json';
const fileName = 'myfile';
const CACHE_NAME = 'test-cache';

// Read a file from the filesystem
function readFile(filePath: string) {
  try {
    const data = fs.readFileSync(filePath);
    return new Uint8Array(data);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

// Creates the Momento cache client object
function createCacheClient(): Promise<CacheClient> {
  return CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 600,
  });
}

async function writeToCache(client: CacheClient, cacheName: string, key: string, data: Uint8Array) {
  const setResponse = await client.set(cacheName, key, data);
  switch (setResponse.type) {
    case CacheSetResponse.Success:
      console.log('Key stored successfully!');
      break;
    case CacheSetResponse.Error:
      console.log(`Error setting key: ${setResponse.toString()}`);
      break;
  }
}

async function readFromCache(client: CacheClient, cacheName: string, key: string) {
  const fileResponse = await client.get(cacheName, key);
  switch (fileResponse.type) {
    case CacheGetResponse.Miss:
      console.log('cache miss');
      break;
    case CacheGetResponse.Hit: {
      console.log(`cache hit: ${fileResponse.valueString()}`);
      const contents = fileResponse.valueUint8Array();
      const buffer = Buffer.from(contents);
      fs.writeFileSync('./myfile2.json', buffer);
      break;
    }
    case CacheGetResponse.Error:
      console.log(`Error: ${fileResponse.message()}`);
      break;
  }
}

async function run() {
  const byteArray = readFile(filePath);
  if (byteArray === null) {
    return;
  }

  const cacheClient = await createCacheClient();

  await writeToCache(cacheClient, CACHE_NAME, fileName, byteArray);
  await readFromCache(cacheClient, CACHE_NAME, fileName);
}

run().catch(e => {
  console.error('Uncaught exception!', e);
  throw e;
});
