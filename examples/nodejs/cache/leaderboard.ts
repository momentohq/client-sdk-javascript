import {LeaderboardClient, LeaderboardConfigurations, CredentialProvider, SortedSetOrder} from '@gomomento/sdk';

async function main() {
  const client = new LeaderboardClient({
    configuration: LeaderboardConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });

  // upsert
  const elements: Map<bigint, number> = new Map([
    [123n, 100],
    [456n, 200],
    [789n, 300],
  ]);
  const upsertResp = await client.leaderboardUpsert(
    "my-cache", 
    "my-leaderboard", 
    elements
  );
  console.log("Upsert elements:", upsertResp.toString());
  
  // fetch by score
  const fetchByScore = await client.leaderboardFetchByScore(
    "my-cache", 
    "my-leaderboard", 
    {
      minScore: 100,
      maxScore: 500,
      order: SortedSetOrder.Descending,
      offset: 10,
      count: 100,
    }
  );
  console.log("Fetch by score:", fetchByScore.toString());

  // fetch by rank
  const fetchByRank = await client.leaderboardFetchByRank(
    "my-cache", 
    "my-leaderboard", 
    {
      startRank: 1,
      endRank: 5,
      order: SortedSetOrder.Ascending
    }
  );
  console.log("Fetch by rank:", fetchByRank.toString());

  // get rank
  const getRank = await client.leaderboardGetRank(
    "my-cache", 
    "my-leaderboard", 
    123n
  );
  console.log("Get rank:", getRank.toString());

  // length
  const lengthResp = await client.leaderboardLength(
    "my-cache", 
    "my-leaderboard", 
  );
  console.log("Get leaderboard length:", lengthResp.toString());

  // remove
  const removeResp = await client.leaderboardRemoveElements(
    "my-cache", 
    "my-leaderboard", 
    [123n, 456n, 789n]
  );
  console.log("Remove elements:", removeResp.toString());

  // delete
  const deleteResp = await client.leaderboardDelete(
    "my-cache", 
    "my-leaderboard", 
  );
  console.log("Delete leaderboard:", deleteResp.toString());
}

main()
  .then(() => {
    console.log('Leaderboard example completed!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });