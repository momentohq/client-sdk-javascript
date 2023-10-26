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
    const durations = []; // Store durations for each call

    for (let i = 0; i < 100; i++) {
      console.time(`generateDisposableToken-call-${i}`);
      const startTime = Date.now();

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
      const duration = Date.now() - startTime;
      durations.push(duration);
      console.timeEnd(`generateDisposableToken-call-${i}`);

      if (tokenResponse instanceof GenerateDisposableToken.Success) {
        console.log('Successfully generated token');
      }
    }

    // Calculate metrics
    const totalDuration = durations.reduce((acc, curr) => acc + curr, 0);
    const average = totalDuration / durations.length;

    const sortedDurations = durations.sort((a, b) => a - b);
    const p99Index = Math.ceil(0.99 * sortedDurations.length) - 1;
    const p99 = sortedDurations[p99Index];

    const maxTime = Math.max(...durations);

    console.log(`Average time: ${average}ms`);
    console.log(`P99 time: ${p99}ms`);
    console.log(`Max time: ${maxTime}ms`);

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
