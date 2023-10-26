import {
  AllCaches,
  AllTopics,
  AuthClient, CacheClient, CacheGet, Configurations,
  CredentialProvider,
  ExpiresIn,
  GenerateDisposableToken,
  TopicRole,
} from '@gomomento/sdk';

const authClient = getAuthClient();
let _cacheClient: CacheClient | undefined = undefined;

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

    console.log(`Now getting for cache requests`);
    const cacheClient = await getCacheClient();

    const cacheDurations = []; // Store durations for each call

    for (let i = 0; i < 100; i++) {
      console.time(`cacheGet-call-${i}`);

      const startTime = Date.now();

      const response = await cacheClient.get('cache', 'key');
      const duration = Date.now() - startTime;
      cacheDurations.push(duration);
      console.timeEnd(`cacheGet-call-${i}`);

      if (response instanceof CacheGet.Hit) {
        console.log(`response ${i}: Hit!`);
      } else if (response instanceof CacheGet.Miss) {
        console.log(`response ${i}: Miss!`);
      } else {
        console.log(`response ${i}: Error!`);
      }
    }


    // Calculate metrics
    const totalDurationC = cacheDurations.reduce((acc, curr) => acc + curr, 0);
    const averageC = totalDuration / cacheDurations.length;

    const sortedDurationsC = cacheDurations.sort((a, b) => a - b);
    const p99IndexC = Math.ceil(0.99 * sortedDurationsC.length) - 1;
    const p99c = sortedDurations[p99IndexC];

    console.log(`Average time: ${averageC}ms`);
    console.log(`P99 time: ${p99c}ms`);
    console.log(`Max time: ${Math.max(...cacheDurations)}ms`);

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

async function getCacheClient(): Promise<CacheClient> {
  const apiKeySecretName = process.env.MOMENTO_API_KEY;
  if (apiKeySecretName === undefined) {
    throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
  }
  if (_cacheClient === undefined) {
    console.log('Retrieved secret!');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    _cacheClient = await CacheClient.create({
      configuration: Configurations.Lambda.latest(),
      credentialProvider: CredentialProvider.fromString({apiKey: apiKeySecretName}),
      defaultTtlSeconds: 60,
    });
  }
  return _cacheClient;
}
