import {
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  CredentialProvider,
  LeaderboardDelete,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  DefaultMomentoLoggerLevel,
  DefaultMomentoLoggerFactory,
} from '@gomomento/sdk';

async function main() {
  const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
  let momentoConfig = LeaderboardConfigurations.Laptop.v1(loggerFactory);
  const grpcConfig = momentoConfig.getTransportStrategy().getGrpcConfig().withNumClients(1);
  momentoConfig = momentoConfig.withTransportStrategy(momentoConfig.getTransportStrategy().withGrpcConfig(grpcConfig));

  const client = new PreviewLeaderboardClient({
    configuration: momentoConfig,
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });

  // Create a leaderboard with given cache and leaderboard names
  const leaderboard = client.leaderboard('cache', 'my-leaderboard');

  // eslint-disable-next-line no-constant-condition
  while (1 > 0) {
    const numberOfElements = Math.floor(Math.random() * 10) + 1; // Generate between 1 and 10
    const elementsToUpsert = new Map<number, number>();
    const elementsToRemove: number[] = [];

    // Generate and upsert random elements
    for (let i = 0; i < numberOfElements; i++) {
      const randomKey = Math.floor(Math.random() * 1000);
      const randomScore = Math.random() * 100;
      elementsToUpsert.set(randomKey, randomScore);
      elementsToRemove.push(randomKey);
    }
    const upsertResp = await leaderboard.upsert(elementsToUpsert);
    if (upsertResp instanceof LeaderboardUpsert.Success) {
      console.log('Upsert success');
    } else if (upsertResp instanceof LeaderboardUpsert.Error) {
      console.log('Upsert error:', upsertResp.message());
    }

    // Remove elements by providing a list of element IDs.
    const removeResp = await leaderboard.removeElements(elementsToRemove);
    if (removeResp instanceof LeaderboardRemoveElements.Success) {
      console.log('Remove elements success');
    } else if (removeResp instanceof LeaderboardRemoveElements.Error) {
      console.log('Remove elements error:', removeResp.message());
    }
    await sleep(100);
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


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .then(() => {
    console.log('Leaderboard example completed!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
