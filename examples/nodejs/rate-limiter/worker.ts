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

  const service = new DummyService();
  const rateLimiterIncrement = new IncrementRateLimiter(momento, 10);
  const rateLimiterGetIncrement = new GetIncrementRateLimiter(momento, 10);

  const totalRequests = 50;
  const userIDs = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const tasks = [];

  // Simulate for both rate limiters
  for (const rateLimiter of [rateLimiterIncrement, rateLimiterGetIncrement]) {
    for (let i = 0; i < totalRequests; i++) {
      const randomDelay = Math.floor(Math.random() * 60000);
      const randomUser = userIDs[Math.floor(Math.random() * userIDs.length)];

      const task = new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await worker(randomUser, rateLimiter, service);
            resolve();
          } catch (error) {
            console.error(`Error in worker for user ${randomUser}:`, error);
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
  if ((await rateLimiter.acquire(id)) === true) {
    service.doWork();
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
