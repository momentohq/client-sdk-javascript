import {
  PreviewLeaderboardClient,
  CacheClient,
  Configurations,
  LeaderboardOrder,
  DefaultMomentoLoggerLevel,
  DefaultMomentoLoggerFactory,
  CreateCacheResponse,
  LeaderboardUpsertResponse,
  LeaderboardFetchResponse,
  LeaderboardLengthResponse,
  LeaderboardRemoveElementsResponse,
  LeaderboardDeleteResponse,
} from '@gomomento/sdk';

async function main() {
  // NOTE: you can use TRACE level logging to view leaderboard interactions, but you likely want to
  // disable that in production to save log noise by switching to ERROR or INFO level instead.
  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.TRACE);
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(loggerFactory),
    defaultTtlSeconds: 60,
  });

  const createCacheResponse = await cacheClient.createCache('my-cache');
  switch (createCacheResponse.type) {
    case CreateCacheResponse.AlreadyExists:
      console.log('cache already exists');
      break;
    case CreateCacheResponse.Success:
      console.log('cache created');
      break;
    case CreateCacheResponse.Error:
      throw createCacheResponse.innerException();
  }

  const client = new PreviewLeaderboardClient();

  // Create a leaderboard with given cache and leaderboard names
  const leaderboard = client.leaderboard('my-cache', 'my-leaderboard');

  // Upsert elements as a Map
  const elements1: Map<number, number> = new Map([
    [123, 100.0],
    [456, 200.0],
    [789, 300.0],
  ]);
  const upsertResp1 = await leaderboard.upsert(elements1);
  switch (upsertResp1.type) {
    case LeaderboardUpsertResponse.Success:
      console.log('Upsert attempt 1: success');
      break;
    case LeaderboardUpsertResponse.Error:
      console.log('Upsert error:', upsertResp1.message());
      break;
  }

  // Or upsert elements using a Record
  const elements2: Record<number, number> = {
    1234: 111,
    5678: 222,
  };

  const upsertResp2 = await leaderboard.upsert(elements2);
  switch (upsertResp2.type) {
    case LeaderboardUpsertResponse.Success:
      console.log('Upsert attempt 2: success');
      break;
    case LeaderboardUpsertResponse.Error:
      console.log('Upsert error:', upsertResp2.message());
      break;
  }

  // Fetch by score example specifying all options.
  const fetchByScore = await leaderboard.fetchByScore({
    minScore: 100,
    maxScore: 500,
    order: LeaderboardOrder.Ascending,
    offset: 10,
    count: 100,
  });
  switch (fetchByScore.type) {
    case LeaderboardFetchResponse.Success:
      console.log('Fetch by score success:', fetchByScore.values());
      break;
    case LeaderboardFetchResponse.Error:
      console.log('Fetch by score error:', fetchByScore.message());
      break;
  }

  // Fetch by rank can be used to page through the leaderboard
  // by requesting N elements at a time (maximum 8192 at a time).
  // This example is using N=2 for this small leaderboard.
  for (let rank = 0; rank < 5; rank += 2) {
    const startRank = rank;
    const endRank = rank + 2;
    const fetchByRank = await leaderboard.fetchByRank(startRank, endRank, {order: LeaderboardOrder.Ascending});
    switch (fetchByRank.type) {
      case LeaderboardFetchResponse.Success:
        console.log('Fetch by rank success:', fetchByRank.values());
        break;
      case LeaderboardFetchResponse.Error:
        console.log('Fetch by rank error:', fetchByRank.message());
        break;
    }
  }

  // Get rank fetches elements given a list of element IDs.
  const getRank = await leaderboard.getRank([123, 1234], {
    order: LeaderboardOrder.Ascending,
  });
  switch (getRank.type) {
    case LeaderboardFetchResponse.Success:
      console.log('Get rank success:', getRank.values());
      break;
    case LeaderboardFetchResponse.Error:
      console.log('Get rank error:', getRank.message());
      break;
  }

  // Length returns length of a leaderboard. Returns 0 if
  // leaderboard is empty or doesn't exist.
  const lengthResp = await leaderboard.length();
  switch (lengthResp.type) {
    case LeaderboardLengthResponse.Success:
      console.log('Get leaderboard length success:', lengthResp.length());
      break;
    case LeaderboardLengthResponse.Error:
      console.log('Get leaderboard length error:', lengthResp.message());
      break;
  }

  // Remove elements by providing a list of element IDs.
  const removeResp = await leaderboard.removeElements([123, 456, 789]);
  switch (removeResp.type) {
    case LeaderboardRemoveElementsResponse.Success:
      console.log('Remove elements success');
      break;
    case LeaderboardRemoveElementsResponse.Error:
      console.log('Remove elements error:', removeResp.message());
      break;
  }

  // Delete will remove theh entire leaderboard.
  // Leaderboard items have no TTL so make sure to clean up
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
