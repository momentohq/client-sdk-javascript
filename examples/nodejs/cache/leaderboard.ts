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

  // Upsert elements as a Map
  const elements1: Map<number, number> = new Map([
    [123, 100.0],
    [456, 200.0],
    [789, 300.0],
  ]);
  const upsertResp1 = await leaderboard.upsert(elements1);
  if (upsertResp1 instanceof LeaderboardUpsert.Success) {
    console.log('Upsert attempt 1: success');
  } else if (upsertResp1 instanceof LeaderboardUpsert.Error) {
    console.log('Upsert error:', upsertResp1.message());
  }

  // Or upsert elements using a Record
  const elements2: Record<number, number> = {
    1234: 111,
    5678: 222,
  };
  const upsertResp2 = await leaderboard.upsert(elements2);
  if (upsertResp2 instanceof LeaderboardUpsert.Success) {
    console.log('Upsert attempt 2: success');
  } else if (upsertResp2 instanceof LeaderboardUpsert.Error) {
    console.log('Upsert error:', upsertResp2.message());
  }

  // Fetch by score example specifying all options.
  const fetchByScore = await leaderboard.fetchByScore({
    minScore: 100,
    maxScore: 500,
    order: LeaderboardOrder.Ascending,
    offset: 10,
    count: 100,
  });
  if (fetchByScore instanceof LeaderboardFetch.Success) {
    console.log('Fetch by score success:', fetchByScore.values());
  } else if (fetchByScore instanceof LeaderboardFetch.Error) {
    console.log('Fetch by score error:', fetchByScore.message());
  }

  // Fetch by rank can be used to page through the leaderboard
  // by requesting N elements at a time (maximum 8192 at a time).
  // This example is using N=2 for this small leaderboard.
  for (let rank = 0; rank < 5; rank += 2) {
    const startRank = rank;
    const endRank = rank + 2;
    const fetchByRank = await leaderboard.fetchByRank(startRank, endRank, {order: LeaderboardOrder.Ascending});
    if (fetchByRank instanceof LeaderboardFetch.Success) {
      console.log('Fetch by rank success:', fetchByRank.values());
    } else if (fetchByRank instanceof LeaderboardFetch.Error) {
      console.log('Fetch by rank error:', fetchByRank.message());
    }
  }

  // Get rank fetches elements given a list of element IDs.
  const getRank = await leaderboard.getRank([123, 1234], {
    order: LeaderboardOrder.Ascending,
  });
  if (getRank instanceof LeaderboardFetch.Success) {
    console.log('Get rank success:', getRank.values());
  } else if (getRank instanceof LeaderboardFetch.Error) {
    console.log('Get rank error:', getRank.message());
  }

  // Length returns length of a leaderboard. Returns 0 if
  // leaderboard is empty or doesn't exist.
  const lengthResp = await leaderboard.length();
  if (lengthResp instanceof LeaderboardLength.Success) {
    console.log('Get leaderboard length success:', lengthResp.length());
  } else if (lengthResp instanceof LeaderboardLength.Error) {
    console.log('Get leaderboard length error:', lengthResp.message());
  }

  // Remove elements by providing a list of element IDs.
  const removeResp = await leaderboard.removeElements([123, 456, 789]);
  if (removeResp instanceof LeaderboardRemoveElements.Success) {
    console.log('Remove elements success');
  } else if (removeResp instanceof LeaderboardRemoveElements.Error) {
    console.log('Remove elements error:', removeResp.message());
  }

  // Delete will remove theh entire leaderboard.
  // Leaderboard items have no TTL so make sure to clean up
  // all unnecessary elements when no longer needed.
  const deleteResp = await leaderboard.delete();
  if (deleteResp instanceof LeaderboardDelete.Success) {
    console.log('Delete leaderboard success');
  } else if (deleteResp instanceof LeaderboardDelete.Error) {
    console.log('Delete leaderboard error:', deleteResp.message());
  }
}

main()
  .then(() => {
    console.log('Leaderboard example completed!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
