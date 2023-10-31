import {CacheClient, Configurations, CredentialProvider} from "@gomomento/sdk";
import {IncrementRateLimiter} from "./increment-only-rate-limiter";
import {DummyService} from "./service";
import {GetIncrementRateLimiter} from "./get-increment-rate-limiter";
import {RateLimiter} from "./rate-limiter";

async function main() {
  const momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 6000,
  });


  // default values
  let totalRequests = 10000;
  let randomDelayUpperBound = 60000;
  let tpmLimit = 1;

  if (process.argv[2]) {
    totalRequests = parseInt(process.argv[2], 10);
  }

  if (process.argv[3]) {
    randomDelayUpperBound = parseInt(process.argv[3], 10);
  }

  if (process.argv[4]) {
    tpmLimit = parseInt(process.argv[4], 10);
  }

  const service = new DummyService();
  const rateLimiterIncrement = new IncrementRateLimiter(momento, tpmLimit);
  const rateLimiterGetIncrement = new GetIncrementRateLimiter(momento, tpmLimit);


  const userIDs = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const tasks = [];
  let currentUserIndex = 0;

  console.log(`Simulating ${totalRequests} requests for each rate limiter with a random delay between requests upto a max of ${randomDelayUpperBound} milliseconds.`);

  // Simulate for both rate limiters
  for (const rateLimiter of [rateLimiterIncrement, rateLimiterGetIncrement]) {
    for (let i = 0; i < totalRequests; i++) {
      const randomDelay = Math.floor(Math.random() * randomDelayUpperBound);
      // Round-robin user selection
      const selectedUser = userIDs[currentUserIndex];
      currentUserIndex = (currentUserIndex + 1) % userIDs.length;

      const task = new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await worker(selectedUser.concat(rateLimiter.constructor.name), rateLimiter, service);
            resolve();
          } catch (error) {
            console.error(`Error in worker for user ${selectedUser}:`, error);
            resolve();
          }
        }, randomDelay);
      });

      tasks.push(task);
    }
  }

  await Promise.all(tasks);

  // Display metrics for both rate limiters
  rateLimiterIncrement.metrics.displayMetrics("Increment");
  rateLimiterGetIncrement.metrics.displayMetrics("GetIncrement");
}

async function worker(id: string, rateLimiter: RateLimiter, service: DummyService) {
  const start = Date.now();
  try {
    const allowed = await rateLimiter.acquire(id);
    const latency = Date.now() - start;
    if (allowed) {
      rateLimiter.getMetrics().recordSuccess(latency);
    } else {
      rateLimiter.getMetrics().recordThrottle(latency);
    }
  } catch (err) {
    rateLimiter.getMetrics().recordErrors();
    console.error(`Error while calling rate limiter ${err}`)
  }
}

main()
  .then(() => {
    console.log('All tasks complete!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
