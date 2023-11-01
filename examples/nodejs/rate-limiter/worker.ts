import {
  CacheClient,
  Configurations,
  CreateCache,
  CredentialProvider,
} from "@gomomento/sdk";
import { IncrementRateLimiter } from "./increment-only-rate-limiter";
import { DummyService } from "./service";
import { GetIncrementRateLimiter } from "./get-increment-rate-limiter";
import { RATE_LIMITER_CACHE_NAME, RateLimiter } from "./rate-limiter";
import { Metrics } from "./metrics";

async function main() {
  const momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: "MOMENTO_API_KEY",
    }),
    defaultTtlSeconds: 6000,
  });

  const resp = await momento.createCache(RATE_LIMITER_CACHE_NAME);
  if (resp instanceof CreateCache.Error) {
    throw new Error(`Failed to create cache ${RATE_LIMITER_CACHE_NAME}`);
  }

  // default values
  let totalRequests = 1000;
  let randomDelayUpperBound = 60000;
  let tpmLimit = 5000;

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
  const rateLimiterIncrementMetrics = new Metrics();
  const rateLimiterGetIncrementMetrics = new Metrics();

  const rateLimiters = [
    {
      limiter: new IncrementRateLimiter(momento, tpmLimit),
      metrics: rateLimiterIncrementMetrics,
    },
    {
      limiter: new GetIncrementRateLimiter(momento, tpmLimit),
      metrics: rateLimiterGetIncrementMetrics,
    },
  ];

  const userIDs = ["user1", "user2", "user3", "user4", "user5"];
  const tasks = [];
  let currentUserIndex = 0;

  console.log(
    `Simulating ${totalRequests} requests for each rate limiter with a random delay between requests upto a max of ${randomDelayUpperBound} milliseconds. The rate limiter allow ${tpmLimit} requests per minute. The simulation uses ${userIDs.length} users and evenly divides requests for each user.`
  );

  // Simulate for both rate limiters
  for (const { limiter, metrics } of rateLimiters) {
    for (let i = 0; i < totalRequests; i++) {
      const randomDelay = Math.floor(Math.random() * randomDelayUpperBound);
      // Round-robin user selection
      const selectedUser = userIDs[currentUserIndex];
      currentUserIndex = (currentUserIndex + 1) % userIDs.length;

      const task = new Promise<void>((resolve) => {
        setTimeout(() => {
          worker(
            selectedUser.concat("-".concat(limiter.constructor.name)),
            limiter,
            service,
            metrics
          )
            .then(() => {
              resolve();
            })
            .catch((error) => {
              console.error(`Error in worker for user ${selectedUser}:`, error);
              resolve();
            });
        }, randomDelay);
      });

      tasks.push(task);
    }
  }

  await Promise.all(tasks);

  // Display metrics for both rate limiters
  rateLimiterIncrementMetrics.displayMetrics("Increment");
  rateLimiterGetIncrementMetrics.displayMetrics("GetIncrement");
}

async function worker(
  id: string,
  rateLimiter: RateLimiter,
  service: DummyService,
  metrics: Metrics
) {
  try {
    const start = Date.now();
    const allowed = await rateLimiter.acquire(id);
    const latency = Date.now() - start;
    if (allowed) {
      metrics.recordSuccess(latency);
      service.doWork();
    } else {
      metrics.recordThrottle(latency);
    }
  } catch (err) {
    metrics.recordErrors();
    console.error(`Error while calling rate limiter ${(err as Error).message}`);
  }
}

main()
  .then(() => {
    console.log("All tasks complete!");
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
