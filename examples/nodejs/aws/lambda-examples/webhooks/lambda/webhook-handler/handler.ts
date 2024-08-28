import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {
  CacheClient,
  CacheListPushFrontResponse,
  Configurations,
  CredentialProvider,
  WebhookUtils,
} from '@gomomento/sdk';

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _cacheClient: CacheClient | undefined = undefined;

const cacheName = 'course-comments';

interface LambdaEvent {
  headers: Record<string, string>;
  body: string;
}

interface Payload {
  token_id: string;
  text: string;
}

interface Message {
  courseId: string;
  comment: string;
}

export const handler = async (event: LambdaEvent) => {
  try {
    const secretStringSecretName = process.env.THE_SIGNING_SECRET;

    if (secretStringSecretName === undefined) {
      throw new Error("Missing required env var 'THE_SIGNING_SECRET");
    }

    const secretString = await getSecret(secretStringSecretName);
    const authorized = WebhookUtils.validateWebhookRequest({
      signature: event.headers['momento-signature'],
      signingSecret: secretString,
      body: event.body,
    });

    if (authorized !== WebhookUtils.RequestValidation.VALID) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"message": "Access Denied!"}',
      };
    }

    const payload: Payload = JSON.parse(event.body) as Payload;
    const userID = payload.token_id;
    const message = JSON.parse(payload.text) as Message;

    console.log('Storing user comment for userID ' + userID + ' and courseId ' + message.courseId);
    console.log('Comment: ' + message.comment);

    const cacheClient = await getCacheClient();
    if (_cacheClient === undefined) {
      throw new Error('Cache client is undefined');
    }

    const listResp = await cacheClient.listPushFront(
      cacheName,
      String(message.courseId),
      JSON.stringify({userID: userID, comment: message.comment})
    );
    switch (listResp.type) {
      case CacheListPushFrontResponse.Success:
        console.log('Successfully persisted comment for course');
        break;
      case CacheListPushFrontResponse.Error:
        console.log('Error while publishing comment for course ' + listResp.message());
        break;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occurred!' + String(err),
      }),
    };
  }
};

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
      configuration: Configurations.Lambda.latest(),
      credentialProvider: CredentialProvider.fromString({apiKey: momentoApiKey}),
      defaultTtlSeconds: 60,
    });
  }
  return _cacheClient;
}
