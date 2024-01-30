import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {CacheClient, CacheGet, CacheListPushFront, Configurations, CredentialProvider} from '@gomomento/sdk';
import * as crypto from "crypto";

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _cacheClient: CacheClient | undefined = undefined;

const cacheName = 'course-comments';

export const handler = async (event: any) => {
  try {

    const secretStringSecretName = process.env.THE_SIGNING_SECRET;

    if (secretStringSecretName === undefined) {
      throw new Error("Missing required env var 'THE_SIGNING_SECRET");
    }

    const secretString = await getSecret(secretStringSecretName);
    const authorized = verifySignature(event.headers['momento-signature'], secretString, event.body);
    if (!authorized) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: '{"message": "Access Denied!"}',
      };
    }

    const payload = JSON.parse(event.body)
    const userID = payload.token_id
    const message = JSON.parse(payload.text)

    console.log('Storing user comment for userID ' + userID + ' and courseId ' + message.courseId);
    console.log('Comment: ' + message.comment);

    const cacheClient = await getCacheClient();
    if (_cacheClient === undefined) {
      throw new Error('Cache client is undefined');
    }

    const listResp = await cacheClient.listPushFront(cacheName, String(message.courseId),
      JSON.stringify({userID: userID, comment: message.comment}));
    if (listResp instanceof CacheListPushFront.Success) {
      console.log('Successfully persisted comment for course');
    } else if (listResp instanceof CacheListPushFront.Error) {
      console.log('Error while publishing comment for course ' + listResp.message());
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
        message: 'An error occurred!' + err
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

function verifySignature(signature: string, secret: string, body: string) {
  if (process.env.THE_SIGNING_SECRET === undefined) {
    throw new Error("Missing required env var 'THE_SIGNING_SECRET");
  }

  const hash = crypto.createHmac("SHA3-256", secret);
  const hashed = hash.update(body).digest('hex');
  return hashed === signature;
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
