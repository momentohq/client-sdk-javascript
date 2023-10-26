process.env.GRPC_VERBOSITY = 'debug';
process.env.GRPC_TRACE = 'dns_resolver,resolving_load_balancer,index';

import {
  AllCaches,
  AllTopics,
  AuthClient,
  CredentialProvider,
  ExpiresIn,
  GenerateDisposableToken,
  TopicRole,
} from '@gomomento/sdk';

const authClient = getAuthClient();

export const handler = async () => {
  try {

    for (let i = 0; i < 100; i++) {
      const tokenResponse = await authClient.generateDisposableToken(
        {
          permissions: [
            {
              role: TopicRole.PublishSubscribe,
              cache: AllCaches,
              topic: AllTopics,
            },
          ],
        },
        ExpiresIn.seconds(60),
      );
      if (tokenResponse instanceof GenerateDisposableToken.Success) {
        console.log('Successfully generated token');
      }
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

function getAuthClient(): AuthClient {
  const apiKeySecretName = process.env.MOMENTO_API_KEY;
  if (apiKeySecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
  }
  return new AuthClient({
    credentialProvider: CredentialProvider.fromString({apiKey: apiKeySecretName}),
  });
}
