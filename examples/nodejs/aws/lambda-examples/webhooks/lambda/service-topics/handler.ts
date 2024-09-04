import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';
import {
  AuthClient,
  Configurations,
  CredentialProvider,
  DisposableTokenScopes,
  ExpiresIn,
  GenerateDisposableTokenResponse,
  TopicClient,
  TopicPublishResponse,
} from '@gomomento/sdk';

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();
let _authClient: AuthClient | undefined = undefined;
let _topicClient: TopicClient | undefined = undefined;

const cacheName = 'course-comments';
const topicName = 'comment';

export const handler = async () => {
  try {
    const authClient = await getAuthClient();

    const eventsPublishToken = await authClient.generateDisposableToken(
      DisposableTokenScopes.topicPublishOnly(cacheName, topicName),
      ExpiresIn.minutes(30),
      {tokenId: 'taylor'}
    );

    switch (eventsPublishToken.type) {
      case GenerateDisposableTokenResponse.Success: {
        console.log('Generated a disposable API key with access to the "events" topic in the "cache" cache!');
        // logging only a substring of the tokens, because logging security credentials is not advisable :)
        //console.log(`API key starts with: ${eventsPublishToken.authToken.substring(0, 10)}`);
        //console.log(`Expires At: ${eventsPublishToken.expiresAt.epoch()}`);
        console.log('Publishing to the "events" topic in the "cache" cache! using the generated disposable token');
        const topicClient = getTopicClient(eventsPublishToken.authToken);
        const message = JSON.stringify({
          comment: 'This course and video is awesome!',
          courseId: 123,
        });
        console.log('Message: ' + message);
        const publishResponse = await topicClient.publish(cacheName, topicName, message);
        switch (publishResponse.type) {
          case TopicPublishResponse.Success:
            console.log('Published to the "events" topic in the "cache" cache!');
            break;
          case TopicPublishResponse.Error:
            throw new Error(
              `An error occurred while attempting to publish to the "events" topic in the "cache" cache: ${publishResponse.errorCode()}: ${publishResponse.toString()}`
            );
        }
        break;
      }
      case GenerateDisposableTokenResponse.Error:
        throw new Error(
          `An error occurred while attempting to call generateApiKey with disposable token scope: ${eventsPublishToken.errorCode()}: ${eventsPublishToken.toString()}`
        );
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

async function getAuthClient(): Promise<AuthClient> {
  const apiKeySecretName = process.env.MOMENTO_API_KEY_SECRET_NAME;
  if (apiKeySecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
  }
  if (_authClient === undefined) {
    const momentoApiKey = await getSecret(apiKeySecretName);
    console.log('Retrieved secret!');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    _authClient = new AuthClient({
      credentialProvider: CredentialProvider.fromString({apiKey: momentoApiKey}),
    });
  }
  return _authClient;
}

function getTopicClient(disposableTokenKey: string): TopicClient {
  if (_topicClient === undefined) {
    console.log('Retrieved secret!');
    _topicClient = new TopicClient({
      configuration: Configurations.Lambda.latest(),
      credentialProvider: CredentialProvider.fromString({apiKey: disposableTokenKey}),
    });
  }

  return _topicClient;
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
