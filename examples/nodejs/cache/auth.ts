import {
  AllCaches,
  AllTopics,
  AuthClient, CacheClient, CacheGet, Configurations,
  CredentialProvider,
  ExpiresIn,
  GenerateDisposableToken,
  TopicRole,
} from '@gomomento/sdk';

function getAuthClient(): AuthClient {
  const apiKeySecretName = process.env.MOMENTO_API_KEY;
  if (apiKeySecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_API_KEY");
  }
  return new AuthClient({
    credentialProvider: CredentialProvider.fromString({apiKey: apiKeySecretName}),
  });
}

async function main() {
  const authClient = getAuthClient();

  const durations = []; // Store durations for each call

  for (let i = 0; i < 100; i++) {
    console.time(`generateDisposableToken-call-${i}`);
    const startTime = Date.now();

    const tokenResponse = await authClient.generateDisposableToken(
      {
        permissions: [
          {
            role: TopicRole.PublishSubscribe,
            cache: 'cache',
            topic: 'topic',
          },
        ],
      },
      ExpiresIn.seconds(60),
    );
    const duration = Date.now() - startTime;
    durations.push(duration);
    console.timeEnd(`generateDisposableToken-call-${i}`);

    if (tokenResponse instanceof GenerateDisposableToken.Success) {
      console.log('Successfully generated token');
    }
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
