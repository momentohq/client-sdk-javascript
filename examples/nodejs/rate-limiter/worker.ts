import {
  CacheClient,
  Configurations,
  CreateCache,
  CredentialProvider,
} from '@gomomento/sdk';
import {DummyService} from './service';
import {MomentoRateLimiter} from './momento-rate-limiter';
import {RateLimiter} from './rate-limiter';
import {Metrics} from './metrics';

async function main() {
  const momento = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 6000,
  });

  // default values
  let totalRequests = 1000;
  let randomDelayUpperBound = 60000;
  let tpmLimit = 500;

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
  const rateLimiterMetrics = new Metrics();
  const cacheName = 'rate-limiter';

  const resp = await momento.createCache(cacheName);
  if (resp instanceof CreateCache.Error) {
    throw new Error(`Failed to create cache ${cacheName}`);
  }

  const rateLimiter = new MomentoRateLimiter(momento, tpmLimit, cacheName);

  const userIDs = ['user1', 'user2', 'user3', 'user4', 'user5'];
  const tasks = [];
  let currentUserIndex = 0;

  console.log(
    `Simulating ${totalRequests} requests for each rate limiter with a random delay between requests upto a max of ${randomDelayUpperBound} milliseconds. The rate limiter allow ${tpmLimit} requests per minute. The simulation uses ${userIDs.length} users and evenly divides requests for each user.`
  );

  for (let i = 0; i < totalRequests; i++) {
    const randomDelay = Math.floor(Math.random() * randomDelayUpperBound);
    // Round-robin user selection
    const selectedUser = userIDs[currentUserIndex];
    currentUserIndex = (currentUserIndex + 1) % userIDs.length;

    const task = new Promise<void>(resolve => {
      setTimeout(() => {
        worker(selectedUser, rateLimiter, service, rateLimiterMetrics)
          .then(() => {
            resolve();
          })
          .catch(error => {
            console.error(`Error in worker for user ${selectedUser}:`, error);
            resolve();
          });
      }, randomDelay);
    });

    tasks.push(task);
  }

  await Promise.all(tasks);

  // Display metrics for both rate limiters
  rateLimiterMetrics.displayMetrics('Momento');
}

async function worker(
  id: string,
  rateLimiter: RateLimiter,
  service: DummyService,
  metrics: Metrics
) {
  try {
    const start = Date.now();
    const allowed = !(await rateLimiter.isLimitExceeded(id));
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
    console.log('All tasks complete!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
