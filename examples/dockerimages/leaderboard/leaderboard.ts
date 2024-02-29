import {
  PreviewLeaderboardClient,
  LeaderboardConfigurations,
  CredentialProvider,
  LeaderboardDelete,
  LeaderboardRemoveElements,
  LeaderboardUpsert,
  DefaultMomentoLoggerLevel,
  DefaultMomentoLoggerFactory, ExperimentalMetricsLoggingMiddleware,
} from '@gomomento/sdk';
import {randomInt} from "crypto";
import Redis from "ioredis";

function calculateFibonacci(n: number): number {
  if (n < 2) {
    return n;
  }
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

function startCpuIntensiveTaskNonBlocking() {
  let i = 0; // Start of range
  const max = 1e6; // Adjust as needed for your CPU-intensive task
  const chunkSize = 1e4; // Number of iterations per interval to avoid blocking

  const intervalId = setInterval(() => {
    const chunkEnd = i + chunkSize;
    let result = 0;
    for (; i < chunkEnd && i < max; i++) {
      result += Math.sqrt(i);
      calculateFibonacci(randomInt(1, 30));
    }

    console.debug(`Current sum: ${result}`); // Example processing of partial results
  }, 0); // Run as often as possible without completely blocking other operations
}

// Your main application logic here


async function main() {


  const useRedis = process.env.useRedis === 'true';
  let leaderboardClient;

  if (useRedis) {

    // Initialize Redis client
    const redisClient = new Redis({host: 'raider-repro-tlghey.serverless.usw2.cache.amazonaws.com', port: 6379});
    redisClient.on('error', function (error) {
      console.error(error);
    });
    const elementsToUpsert = new Map<number, number>();
    const elementsToRemove: number[] = [];
    for (let i = 0; i < 10; i++) {
      const randomKey = Math.floor(Math.random() * 1000);
      const randomScore = Math.random() * 100;
      elementsToUpsert.set(randomKey, randomScore);
      elementsToRemove.push(randomKey);
    }
    const scoreMemberPairs: string[] = [];

    elementsToUpsert.forEach((score, key) => {
      // Convert both score and key to string and add to the array
      // Note: The score is converted to string to match ioredis's expected input
      scoreMemberPairs.push(score.toString(), key.toString());
    });

    // Use the spread operator to pass the score-member pairs to zadd
    const result = await redisClient.zadd('my-leaderboard', ...scoreMemberPairs);
    console.log(`successfully inserted into redis ${result}`);

    leaderboardClient = {
      async upsert(elementsToUpsert: Map<number, number>) {
        // Explicitly type scoreMemberPairs as an array of strings
        const scoreMemberPairs: string[] = [];
        elementsToUpsert.forEach((score, key) => {
          // Convert both score and key to string and add to the array
          // Note: The score is converted to string to match ioredis's expected input
          scoreMemberPairs.push(score.toString(), key.toString());
        });

        // Use the spread operator to pass the score-member pairs to zadd
        const result = await redisClient.zadd('my-leaderboard', ...scoreMemberPairs);
        console.log(`successfully inserted into redis ${result}`);

      },
      async removeElements(elementsToRemove: number[]) {
        for (const key of elementsToRemove) {
          const result = await redisClient.zrem('my-leaderboard', key.toString());
          console.log(`successfully removed from redis ${result}`);
        }
      },
      async delete() {
        await redisClient.del('my-leaderboard');
      },
    };
  } else {

    const loggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
    let momentoConfig = LeaderboardConfigurations.Laptop.v1(loggerFactory);
    const grpcConfig = momentoConfig.getTransportStrategy().getGrpcConfig().withNumClients(1);
    momentoConfig = momentoConfig.withTransportStrategy(momentoConfig.getTransportStrategy().withGrpcConfig(grpcConfig));

    const client = new PreviewLeaderboardClient({
      configuration: momentoConfig.withMiddlewares([new ExperimentalMetricsLoggingMiddleware(loggerFactory)]),
      credentialProvider: CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'MOMENTO_API_KEY',
      }),
    });
    leaderboardClient = client.leaderboard('cache', 'my-leaderboard');
  }

  let taskStarted = false;
  let startTime = Date.now();
  // Create a leaderboard with given cache and leaderboard names

  // eslint-disable-next-line no-constant-condition
  while (1 > 0) {
    if (!taskStarted && Date.now() - startTime > 300000) {
      taskStarted = true;
      startCpuIntensiveTaskNonBlocking();
    }
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
    const upsertResp = await leaderboardClient.upsert(elementsToUpsert);
    if (upsertResp instanceof LeaderboardUpsert.Success) {
      console.log('Upsert success');
    } else if (upsertResp instanceof LeaderboardUpsert.Error) {
      console.log('Upsert error:', upsertResp.message());
    }

    // Remove elements by providing a list of element IDs.
    const removeResp = await leaderboardClient.removeElements(elementsToRemove);
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
  const deleteResp = await leaderboardClient.delete();
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
