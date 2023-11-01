import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {
  CacheClient,
  Configurations,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  CredentialProvider,
  ExperimentalMetricsLoggingMiddleware
} from '@gomomento/sdk';

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _cacheClient: CacheClient | undefined = undefined;

export const handler = async () => {
  try {
    const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
    const logger = loggerFactory.getLogger('CloudWatchMetricsMiddlewaresExample');

    const cacheClient = await getCacheClient(loggerFactory);
    logger.info('Created a CacheClient configured with metrics middleware');

    logger.info('Issuing 10 minutes of set and get requests to generate data for the dashboard example');
    const delayBetweenRequestsMillis = 1000;
    for (let i = 0; i < (60 /* seconds */ * 10 /* minutes */); i++) {
      await cacheClient.set('cache', `metrics-example-${i}`, 'VALUE');
      await cacheClient.get('cache', `metrics-example-${i}`);
      await delay(delayBetweenRequestsMillis);
    }

    logger.info('Momento metrics middleware example complete!');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: '{}',
    };
  } catch (err) {
    console.log('Error occurred in the Lambda handler:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred!',
      }),
    };
  }
};

async function getCacheClient(loggerFactory: DefaultMomentoLoggerFactory): Promise<CacheClient> {
  const apiKeySecretName = process.env.MOMENTO_API_KEY_SECRET_NAME;
  if (apiKeySecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
  }
  if (_cacheClient === undefined) {
    const momentoApiKey = await getSecret(apiKeySecretName);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    _cacheClient = await CacheClient.create({
      configuration: Configurations.Lambda.latest(loggerFactory).withMiddlewares([
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

function delay(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
