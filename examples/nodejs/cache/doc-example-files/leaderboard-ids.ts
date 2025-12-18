import {
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  CredentialProvider,
  CacheClient,
  Configurations,
  LeaderboardOrder,
  CreateCacheResponse,
  LeaderboardUpsertResponse,
  LeaderboardFetchResponse,
  LeaderboardDeleteResponse,
} from '@gomomento/sdk';

async function main() {
  // 1. Create a CacheClient to connect to Momento
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
    defaultTtlSeconds: 60,
  });

  // 2. Create a cache for the leaderboard to live in
  const createCacheResponse = await cacheClient.createCache('my-cache');
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created');
      break;
    case CreateCacheResponse.Error:
      console.log('cache already exists');
  }

  // 3. Create a Leaderboard client
  const client = new PreviewLeaderboardClient({
    configuration: LeaderboardConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvVarV2(),
  });

  // 4. Create a leaderboard with given cache and leaderboard names
  const leaderboard = client.leaderboard('my-cache', 'my-leaderboard');

  // 5. Create a mapping between element IDs and arbitrary strings
  const id2name: Record<number, string> = {
    123: 'Alice',
    456: 'Bob',
    789: 'Charlie',
    1234: 'David',
    5678: 'Eve',
  };

  // 6. Upsert the elements along with some scores
  const upsertElements: Record<number, number> = {};
  for (const id of Object.keys(id2name)) {
    upsertElements[Number(id)] = Math.floor(Math.random() * 1000);
  }
  const upsertResponse = await leaderboard.upsert(upsertElements);
  switch (upsertResponse.type) {
    case LeaderboardUpsertResponse.Success:
      console.log('Upsert success!');
      break;
    case LeaderboardUpsertResponse.Error:
      console.log('Upsert error:', upsertResponse.message());
      break;
  }

  // 7. Fetch the top 5 elements in the leaderboard and print scores and corresponding strings
  const fetchResponse = await leaderboard.fetchByRank(0, 5, { order: LeaderboardOrder.Descending });
  switch (fetchResponse.type) {
    case LeaderboardFetchResponse.Success: {
      const elements = fetchResponse.values();
      console.log('------------Top 5 Leaderboard-------------');
      console.log('------------------------------------------');
      for (const element of elements) {
        console.log(`${id2name[element.id]}: ${element.score}`);
      }
      console.log('------------------------------------------');
      break;
    }
    case LeaderboardFetchResponse.Error:
      console.log('Fetch error:', fetchResponse.message());
      break;
  }

  // 8. Delete the entire leaderboard when done.
  // Leaderboard items have a default 7-day TTL so make sure to clean up
  // all unnecessary elements when no longer needed.
  const deleteResp = await leaderboard.delete();
  switch (deleteResp.type) {
    case LeaderboardDeleteResponse.Success:
      console.log('Delete leaderboard success');
      break;
    case LeaderboardDeleteResponse.Error:
      console.log('Delete leaderboard error:', deleteResp.message());
      break;
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
