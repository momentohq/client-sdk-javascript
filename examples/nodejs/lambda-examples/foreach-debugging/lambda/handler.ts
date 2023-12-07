import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {
  CacheClient,
  Configurations,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  CredentialProvider,
  ExperimentalMetricsLoggingMiddleware
} from '@gomomento/sdk';

const cases = ['forEach', 'forOf', 'forOfPromiseAll'];
const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.TRACE);
const logger = loggerFactory.getLogger('forEachExperiment');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
let testArray = [...Array(20).keys()];

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _cacheClient: CacheClient | undefined = undefined;

export const handler = async () => {
  try {
    let client = await getCacheClient();
    for (const loopCase of cases) {
      switch (loopCase) {
        case 'forEach':
          await forEachLoop(client);
          logger.debug('done with forEach case!');
          await sleep(20000);
          break;
        case 'forOf':
          await forOfLoop(client);
          logger.debug('done with forOf case!');
          break;
        case 'forOfPromiseAll':
          await forOfPromiseLoop(client);
          logger.debug('done with forOfPromiseAll case!');
          break;
      }
    }
    logger.debug("all done!");

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: '{}',
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred!',
      }),
    };
  }
};

/* APIs used by redefine in the loop: 
  * sortedSetFetchByRank
  * sortedSetPutElements
  * get
  * set
  */
async function momentoOperations(cacheClient: CacheClient) {
  await sleep(1000);
  await cacheClient.sortedSetPutElements('cache', 'anitaSet', {'abc': 123});
  await cacheClient.sortedSetFetchByRank('cache', 'anitaSet');
  await cacheClient.set('cache', 'abc', 'xyz');
  await cacheClient.get('cache', 'abc');
}

async function forEachLoop(cacheClient: CacheClient) {
  logger.debug("Starting forEach loop");
  testArray.forEach(async i => {
    logger.debug(`forEach iteration ${i}`);
    await momentoOperations(cacheClient);
  });
}

async function forOfLoop(cacheClient: CacheClient) {
  logger.debug("Starting for...of loop");
  for (const i of testArray) {
    logger.debug(`for..of iteration ${i}`);
    await momentoOperations(cacheClient);
  }
}

async function forOfPromiseLoop(cacheClient: CacheClient) {
  logger.debug("Starting for...of loop with await Promise.all");
  let promises: Array<Promise<void>> = [];
  for (const i of testArray) {
    logger.debug(`for..of with Promise.all iteration ${i}`);
    promises.push(momentoOperations(cacheClient));
  }
  await Promise.all(promises);
}

async function getCacheClient(): Promise<CacheClient> {
  const apiKeySecretName = process.env.MOMENTO_API_KEY_SECRET_NAME;
  if (apiKeySecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
  }
  if (_cacheClient === undefined) {
    const momentoApiKey = await getSecret(apiKeySecretName);
    console.log('Retrieved secret!');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    _cacheClient = await CacheClient.create({
      configuration: Configurations.Lambda.latest().withMiddlewares([
        new ExperimentalMetricsLoggingMiddleware(loggerFactory),
      ]),
      credentialProvider: CredentialProvider.fromString({apiKey: momentoApiKey}),
      defaultTtlSeconds: 60,
    });
  }
  return _cacheClient;
}

async function getSecret(secretName: string): Promise<string> {
  if (!_cachedSecrets.has(secretName)) {
    const secretResponse = await _secretsClient.send(new GetSecretValueCommand({SecretId: secretName}));
    if (secretResponse) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      _cachedSecrets.set(secretName, secretResponse.SecretString!);
    } else {
      throw new Error(`Unable to retrieve secret: ${secretName}`);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return _cachedSecrets.get(secretName)!;
}
