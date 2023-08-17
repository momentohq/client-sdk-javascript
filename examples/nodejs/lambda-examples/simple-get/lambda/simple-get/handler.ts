import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {CacheClient, CacheGet, Configurations, CredentialProvider, DefaultMomentoLoggerFactory} from '@gomomento/sdk';
import {ExperimentalMetricsLoggingMiddleware} from '@gomomento/sdk/dist/src/config/middleware/experimental-metrics-logging-middleware';

const CACHE_NAME = 'cache';
const KEY = 'key';

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _cacheClient: CacheClient | undefined = undefined;

export const handler = async () => {
  try {
    const cacheClient = await getCacheClient();
    for (let i = 0; i < 100; i++) {
      const response = await cacheClient.get(CACHE_NAME, KEY);
      if (response instanceof CacheGet.Hit) {
        console.log(`response ${i}: Hit!`);
      } else if (response instanceof CacheGet.Miss) {
        console.log(`response ${i}: Miss!`);
      } else {
        console.log(`response ${i}: Error!`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

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

async function getCacheClient(): Promise<CacheClient> {
  const authTokenSecretName = process.env.MOMENTO_AUTH_TOKEN_SECRET_NAME;
  if (authTokenSecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_AUTH_TOKEN_SECRET_NAME");
  }
  if (_cacheClient === undefined) {
    const momentoAuthToken = await getSecret(authTokenSecretName);
    console.log('Retrieved secret!');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    _cacheClient = await CacheClient.create({
      configuration: Configurations.InRegion.Default.v1().addMiddleware(
        new ExperimentalMetricsLoggingMiddleware(new DefaultMomentoLoggerFactory())
      ),
      credentialProvider: CredentialProvider.fromString({authToken: momentoAuthToken}),
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
