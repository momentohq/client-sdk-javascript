import {
  CacheClient,
  CacheDelete,
  CacheDictionaryFetch,
  CacheDictionarySetField,
  Configurations,
  CreateCache,
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import * as crypto from 'crypto';

function range(n: number): number[] {
  return [...Array(n).keys()];
}

function generateRandomString(length: number): string {
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  return randomBytes.toString('hex').slice(0, length);
}

function analyzeDictionaryContents(
  logger: MomentoLogger,
  dictionaryContents: Record<string, string>
): {
  numKeysRead: number;
  totalBytesRead: number;
} {
  let numKeysRead = 0;
  let totalBytesRead = 0;
  for (const [key, value] of Object.entries(dictionaryContents)) {
    logger.debug(`Read key ${key} with value ${value.substring(0, 10)}`);
    numKeysRead++;
    totalBytesRead += key.length + value.length;
  }
  return {numKeysRead, totalBytesRead};
}

class ShardedDictionary {
  private readonly cacheClient: CacheClient;
  private readonly cacheName: string;
  private readonly individualDictionaryNames: string[];
  private readonly logger: MomentoLogger;

  constructor({
    logger,
    cacheClient,
    cacheName,
    dictionaryName,
    maxTotalSizeMb,
  }: {
    logger: MomentoLogger;
    cacheClient: CacheClient;
    cacheName: string;
    dictionaryName: string;
    maxTotalSizeMb: number;
  }) {
    this.logger = logger;
    this.cacheClient = cacheClient;
    this.cacheName = cacheName;

    const momentoLimit_MaxIndividualDictionarySizeMb = 5;
    // give ourselves a little extra room to account for the fact that we're not accounting for the size of the keys,
    // and in case the sharding isn't perfectly balanced.
    const maxTargetBytesPerIndividualDictionary = Math.floor(momentoLimit_MaxIndividualDictionarySizeMb / 2);
    const numDictionariesRequired = Math.ceil(maxTotalSizeMb / maxTargetBytesPerIndividualDictionary);

    this.individualDictionaryNames = range(numDictionariesRequired).map(
      i => `shardedDictionary:${dictionaryName}:${i + 1}_of_${numDictionariesRequired}`
    );
    this.logger.debug(
      `Sharded dictionary will use the following individual dictionarys: ${JSON.stringify(
        this.individualDictionaryNames
      )}`
    );
  }

  public async setField(field: string, value: string): Promise<void> {
    const individualDictionaryToUse = this.determineIndividualDictionaryToUse(field);
    this.logger.debug(`Writing data for field ${field} to individual dictionary ${individualDictionaryToUse}`);
    const dictionarySetFieldResponse = await this.cacheClient.dictionarySetField(
      this.cacheName,
      individualDictionaryToUse,
      field,
      value
    );
    if (dictionarySetFieldResponse instanceof CacheDictionarySetField.Success) {
      return;
    } else {
      throw new Error(`Error setting field ${field} in individual dictionary ${individualDictionaryToUse}`);
    }
  }

  public async fetch(): Promise<Record<string, string>> {
    const individualDictionaryFetchPromises = this.individualDictionaryNames.map(dictionaryName =>
      this.cacheClient.dictionaryFetch(this.cacheName, dictionaryName)
    );

    const responses = await Promise.all(individualDictionaryFetchPromises);
    const individualDictionaryContents = responses.map(response => {
      if (response instanceof CacheDictionaryFetch.Hit) {
        return response.value();
      } else {
        throw new Error(`Error fetching individual dictionary: ${response.toString()}`);
      }
    });
    return Object.assign({}, ...individualDictionaryContents) as Record<string, string>;
  }

  public getIndividualDictionaryNames(): string[] {
    return this.individualDictionaryNames;
  }

  determineIndividualDictionaryToUse(field: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(field);
    const hashValue = hash.digest('hex').slice(0, 8);
    const hashValueAsInt = parseInt(hashValue, 16);
    const individualDictionaryIndex = hashValueAsInt % this.individualDictionaryNames.length;
    return this.individualDictionaryNames[individualDictionaryIndex];
  }
}

async function main() {
  const cacheName = 'cache';
  const shardedDictionaryName = 'myShardedDictionary';

  const credentialsProvider = CredentialProvider.fromEnvVar('MOMENTO_API_KEY');
  const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);
  const logger = loggerFactory.getLogger('shardedDictionaryExample');

  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(loggerFactory).withClientTimeoutMillis(60 * 1_000),
    credentialProvider: credentialsProvider,
    defaultTtlSeconds: 300,
  });

  const createCacheResponse = await cacheClient.createCache(cacheName);
  if (createCacheResponse instanceof CreateCache.AlreadyExists) {
    logger.info('cache already exists');
  } else if (createCacheResponse instanceof CreateCache.Error) {
    throw createCacheResponse.innerException();
  }

  const maxTotalDictionarySizeMb = 10;
  const shardedDictionary = new ShardedDictionary({
    logger,
    cacheClient,
    cacheName,
    dictionaryName: shardedDictionaryName,
    maxTotalSizeMb: maxTotalDictionarySizeMb,
  });

  const totalNumKeys = 2_000;
  const elementSizeBytes = (maxTotalDictionarySizeMb * 1_000_000) / totalNumKeys;
  logger.info(`Sharded dictionary max size: ${maxTotalDictionarySizeMb} MB`);
  logger.info(`Total number of keys: ${totalNumKeys}`);
  logger.info(`Computed element size: ${elementSizeBytes} bytes`);

  const runDurationMillis = 120 * 1_000;
  // Get the current time
  const startTime = new Date().getTime();

  logger.info(`Writing data for ${runDurationMillis / 1_000} seconds`);
  const fieldsWritten = new Set<string>();
  let numWrites = 0;
  while (new Date().getTime() - startTime < runDurationMillis) {
    numWrites++;
    const field = `field${Math.ceil(Math.random() * totalNumKeys)}`;
    fieldsWritten.add(field);
    const value = generateRandomString(elementSizeBytes);
    logger.debug(`Writing data for field ${field}: ${value.substring(0, 10)}...`);
    await shardedDictionary.setField(field, value);
  }

  logger.info(`Completed ${numWrites} writes; wrote ${fieldsWritten.size} keys.`);
  logger.info('Fetching sharded dictionary');
  const fetchStartTime = new Date().getTime();
  const entireDictionaryContents: Record<string, string> = await shardedDictionary.fetch();
  logger.info(`Fetched sharded dictionary in ${new Date().getTime() - fetchStartTime} ms`);
  const {numKeysRead, totalBytesRead} = analyzeDictionaryContents(logger, entireDictionaryContents);

  logger.info(`Final sharded dictionary contained ${numKeysRead} keys and ${totalBytesRead} bytes`);

  const individualDictionaryNames = shardedDictionary.getIndividualDictionaryNames();

  for (const dictionaryName of individualDictionaryNames) {
    logger.info(
      `Using regular Momento client to fetch individual dictionary '${dictionaryName}' from sharded dictionary`
    );
    const dictionaryContentsResponse = await cacheClient.dictionaryFetch(cacheName, dictionaryName);
    if (dictionaryContentsResponse instanceof CacheDictionaryFetch.Hit) {
      const dictionaryContents = dictionaryContentsResponse.value();
      const {numKeysRead, totalBytesRead} = analyzeDictionaryContents(logger, dictionaryContents);
      logger.info(`Individual dictionary contained ${numKeysRead} keys and ${totalBytesRead} bytes`);
    } else {
      throw new Error(`Error fetching dictionary contents: ${dictionaryContentsResponse.toString()}`);
    }
    const deleteDictionaryResponse = await cacheClient.delete(cacheName, dictionaryName);
    if (deleteDictionaryResponse instanceof CacheDelete.Success) {
      logger.info(`Deleted individual dictionary '${dictionaryName}'`);
    } else {
      throw new Error(
        `Error deleting individual dictionary '${dictionaryName}': ${deleteDictionaryResponse.toString()}`
      );
    }
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running dictionary example: ${e.message}`);
    throw e;
  });
