import {
  MomentoSigner,
  CacheOperation,
  SimpleCacheClient,
  LogLevel,
  LogFormat,
  AlreadyExistsError,
} from '@gomomento/sdk';
import fetch, {Response} from 'node-fetch';

const cacheName = 'MyCache';
const cacheKey = 'MyCacheKey';
const cacheValue = 'MyCacheValue';
const expiryEpochSeconds = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes from now
const objectTtlSeconds = 180;

const authToken = requireEnvVar('MOMENTO_AUTH_TOKEN');
const defaultTtl = 60;
const momento = new SimpleCacheClient(authToken, defaultTtl, {
  loggerOptions: {
    level: LogLevel.INFO,
    format: LogFormat.CONSOLE,
  },
});

const main = async () => {
  console.log(`Creating cache '${cacheName}'`);
  try {
    await momento.createCache(cacheName);
  } catch (e) {
    if (e instanceof AlreadyExistsError) {
      console.log(`Cache '${cacheName}' already exists`);
    } else {
      throw e;
    }
  }

  console.log(`Checking for signing key in $MOMENTO_SIGNING_KEY`);
  let signingKey = process.env.MOMENTO_SIGNING_KEY;
  if (!signingKey) {
    // There is a limit of 5 signing keys per user, so it's best practice to
    // create a signing key and store it somewhere secure. For convenience,
    // this example creates a new signing key if one is not set in the
    // environment variable `MOMENTO_SIGNING_KEY`. Signing keys can also be
    // created and revoked via the Momento CLI.
    console.log(
      'Did not find signing key in environment, creating new signing key'
    );
    const signingKeyResponse = await momento.createSigningKey(60 * 24); // valid for 24 hours
    signingKey = signingKeyResponse.getKey();
    process.env.MOMENTO_ENDPOINT = signingKeyResponse.getEndpoint();
  }
  const endpoint = requireEnvVar('MOMENTO_ENDPOINT');

  const signer = await MomentoSigner.init(signingKey);

  console.log('\n*** Running presigned url example ***');
  await runPresignedUrlExample(signer, endpoint);

  console.log('\n*** Running signed token example ***');
  await runSignedTokenExample(signer, endpoint);
};

// Create signed urls for setting and getting values via http for specified cache and
// key
async function runPresignedUrlExample(signer: MomentoSigner, endpoint: string) {
  console.log(
    `Creating signed url for ${CacheOperation.Set} for cache '${cacheName}' and key '${cacheKey}'`
  );
  const setUrl = await signer.createPresignedUrl(endpoint, {
    cacheName: cacheName,
    cacheKey: cacheKey,
    cacheOperation: CacheOperation.Set,
    ttlSeconds: objectTtlSeconds,
    expiryEpochSeconds: expiryEpochSeconds,
  });
  console.log(
    `Creating signed url for ${CacheOperation.Get} for cache '${cacheName}' and key '${cacheKey}'`
  );
  const getUrl = await signer.createPresignedUrl(endpoint, {
    cacheName: cacheName,
    cacheKey: cacheKey,
    cacheOperation: CacheOperation.Get,
    expiryEpochSeconds: expiryEpochSeconds,
  });
  console.log(
    `Created signed urls with claims: exp = ${expiryEpochSeconds}, cache = ${cacheName}, key = ${cacheKey}, ttl seconds (for set) = ${objectTtlSeconds}`
  );

  console.log(
    `Setting value for cache '${cacheName}' and key '${cacheKey}' via HTTP with signed URL: '${cacheValue}'`
  );
  const setResponse = await fetch(setUrl, {method: 'POST', body: cacheValue});
  await ensureSuccessfulResponse(setResponse);
  console.log(
    `Getting value for cache '${cacheName}' and key '${cacheKey}' via HTTP with signed URL`
  );
  const getResponse = await fetch(getUrl);
  await ensureSuccessfulResponse(getResponse);

  const data = await getResponse.text();
  console.log(`Retrieved value with signed URL: ${JSON.stringify(data)}`);
  console.log('Presigned url example finished successfully!');
}

// Create signed token for specified cache. This token is then used for
// setting and getting values via http. Signed tokens are restricted to a
// specific cache, but unlike presigned urls they can be created without
// restrictions on the operation and key they can be used for.
async function runSignedTokenExample(signer: MomentoSigner, endpoint: string) {
  console.log(`Creating new signed access token for cache '${cacheName}'`);
  const signedToken = await signer.signAccessToken({
    cacheName: cacheName,
    expiryEpochSeconds: expiryEpochSeconds,
  });
  console.log(
    `Created signed access token for cache '${cacheName}' with expiry ${expiryEpochSeconds}`
  );

  // build urls
  const cacheKey = 'someKey';
  const setUrl = `https://rest.${endpoint}/cache/set/${cacheName}/${cacheKey}?token=${signedToken}&ttl_milliseconds=${
    objectTtlSeconds * 1000
  }`;
  const getUrl = `https://rest.${endpoint}/cache/get/${cacheName}/${cacheKey}?token=${signedToken}`;

  const cacheValue = 'somedata';
  console.log(
    `Setting value for cache '${cacheName}' and key '${cacheKey}' via HTTP with signed token: '${cacheValue}'`
  );
  const setResponse = await fetch(setUrl, {method: 'POST', body: cacheValue});
  await ensureSuccessfulResponse(setResponse);
  const getResponse = await fetch(getUrl);
  await ensureSuccessfulResponse(getResponse);

  const data = await getResponse.text();
  console.log(
    `Retrieved value via URL with signed token: ${JSON.stringify(data)}`
  );
  console.log('Signed token example finished successfully!\n');
}

function requireEnvVar(envVarName: string): string {
  const result = process.env[envVarName];
  if (!result) {
    throw new Error(`Missing required environment variable ${envVarName}`);
  }
  return result;
}

async function ensureSuccessfulResponse(response: Response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Request failed for ${response.url}:\n${response.status} ${response.statusText} ${message}`
    );
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch(e => {
    console.error('failure :(\n', e);
  });
