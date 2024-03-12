import {
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  CredentialProvider,
  CacheClient,
  Configurations,
  CreateCache,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardOrder,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  DefaultMomentoLoggerLevel,
  DefaultMomentoLoggerFactory,
} from '@gomomento/sdk';

async function main() {
  // NOTE: trace logging to view leaderboard interactions; might want to disable in production to save log noise and
  // switch to ERROR or info
  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.TRACE);
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(loggerFactory),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await cacheClient.createCache('my-cache');
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    console.log('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  const client = new PreviewLeaderboardClient({
    configuration: LeaderboardConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });

  // Create a leaderboard with given cache and leaderboard names
  const leaderboard = client.leaderboard('my-cache', 'my-leaderboard');
  // intentional bad request
  let response = await leaderboard.fetchByRank(0, 8193);
  console.log(`Leaderboard fetchByRank response: ${response.toString()}`);
  response = await leaderboard.fetchByRank(0, 8193);
  console.log(`Leaderboard fetchByRank response: ${response.toString()}`);
  response = await leaderboard.fetchByRank(0, 8193);
  console.log(`Leaderboard fetchByRank response: ${response.toString()}`);
  response = await leaderboard.fetchByRank(0, 8193);
  console.log(`Leaderboard fetchByRank response: ${response.toString()}`);
  response = await leaderboard.fetchByRank(0, 8193);
  console.log(`Leaderboard fetchByRank response: ${response.toString()}`);
}

main()
  .then(() => {
    console.log('Leaderboard example completed!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
