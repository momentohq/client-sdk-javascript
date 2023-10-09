import {
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  CredentialProvider,
  CacheClient,
  Configurations,
} from '@gomomento/sdk';
import {
  CreateCache,
  LeaderboardDelete,
  LeaderboardFetch,
  LeaderboardLength,
  LeaderboardOrder,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
} from '@gomomento/sdk-core';

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
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

  // upsert
  const elements: Map<number, number> = new Map([
    [123, 100.0],
    [456, 200.0],
    [789, 300.0],
  ]);
  const upsertResp = await leaderboard.leaderboardUpsert(elements);
  if (upsertResp instanceof LeaderboardUpsert.Success) {
    console.log('Upsert success');
  } else if (upsertResp instanceof LeaderboardUpsert.Error) {
    console.log('Upsert error:', upsertResp.message());
  }

  // fetch by score
  const fetchByScore = await leaderboard.leaderboardFetchByScore({
    minScore: 100,
    maxScore: 500,
    order: LeaderboardOrder.Ascending,
    offset: 10,
    count: 100,
  });
  if (fetchByScore instanceof LeaderboardFetch.Found) {
    console.log('Fetch by score Found');
  } else if (fetchByScore instanceof LeaderboardFetch.NotFound) {
    console.log('Fetch by score NotFound');
  } else if (fetchByScore instanceof LeaderboardFetch.Error) {
    console.log('Fetch by score error:', fetchByScore.message());
  }

  // fetch by rank
  const fetchByRank = await leaderboard.leaderboardFetchByRank({
    startRank: 1,
    endRank: 5,
    order: LeaderboardOrder.Ascending,
  });
  if (fetchByRank instanceof LeaderboardFetch.Found) {
    console.log('Fetch by rank Found');
  } else if (fetchByRank instanceof LeaderboardFetch.NotFound) {
    console.log('Fetch by rank NotFound');
  } else if (fetchByRank instanceof LeaderboardFetch.Error) {
    console.log('Fetch by rank error:', fetchByRank.message());
  }

  // get rank
  const getRank = await leaderboard.leaderboardGetRank([123], {
    order: LeaderboardOrder.Ascending,
  });
  if (getRank instanceof LeaderboardFetch.Found) {
    console.log('Get rank Found');
  } else if (getRank instanceof LeaderboardFetch.NotFound) {
    console.log('Get rank NotFound');
  } else if (getRank instanceof LeaderboardFetch.Error) {
    console.log('Get rank error:', getRank.message());
  }

  // length
  const lengthResp = await leaderboard.leaderboardLength();
  if (lengthResp instanceof LeaderboardLength.Found) {
    console.log('Get leaderboard length Found');
  } else if (lengthResp instanceof LeaderboardLength.NotFound) {
    console.log('Get leaderboard length NotFound');
  } else if (lengthResp instanceof LeaderboardLength.Error) {
    console.log('Get leaderboard length error:', lengthResp.message());
  }

  // remove
  const removeResp = await leaderboard.leaderboardRemoveElements([
    123,
    456,
    789,
  ]);
  if (removeResp instanceof LeaderboardRemoveElements.Success) {
    console.log('Remove elements success');
  } else if (removeResp instanceof LeaderboardRemoveElements.Error) {
    console.log('Remove elements error:', removeResp.message());
  }

  // delete
  const deleteResp = await leaderboard.leaderboardDelete();
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
