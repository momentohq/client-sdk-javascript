import {v4} from 'uuid';
import {SimpleCacheClientProps} from '../src/simple-cache-client-props';
import {
  CreateCache,
  Configurations,
  DeleteCache,
  EnvMomentoTokenProvider,
  CollectionTtl,
  MomentoErrorCode,
  SimpleCacheClient,
} from '../src';
import {Error, Response} from '../src/messages/responses/response-base';

function testCacheName(): string {
  const name = process.env.TEST_CACHE_NAME || 'js-integration-test-default';
  return name + v4();
}

const deleteCacheIfExists = async (
  momento: SimpleCacheClient,
  cacheName: string
) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export async function WithCache(
  client: SimpleCacheClient,
  cacheName: string,
  block: () => Promise<void>
) {
  await deleteCacheIfExists(client, cacheName);
  await client.createCache(cacheName);
  try {
    await block();
  } finally {
    await deleteCacheIfExists(client, cacheName);
  }
}

export const CacheClientProps: SimpleCacheClientProps = {
  configuration: Configurations.Laptop.latest(),
  credentialProvider: new EnvMomentoTokenProvider('TEST_AUTH_TOKEN'),
  defaultTtlSeconds: 1111,
};

function momentoClientForTesting() {
  return new SimpleCacheClient(CacheClientProps);
}

export function SetupIntegrationTest(): {
  Momento: SimpleCacheClient;
  IntegrationTestCacheName: string;
} {
  const cacheName = testCacheName();

  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoClientForTesting();
    await deleteCacheIfExists(momento, cacheName);
    const createResponse = await momento.createCache(cacheName);
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoClientForTesting();
    const deleteResponse = await momento.deleteCache(cacheName);
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  const client = momentoClientForTesting();
  return {Momento: client, IntegrationTestCacheName: cacheName};
}

export interface ValidateCacheProps {
  cacheName: string;
}

export interface ValidateListProps extends ValidateCacheProps {
  listName: string;
}

export interface ValidateDictionaryProps extends ValidateCacheProps {
  dictionaryName: string;
  field: string | Uint8Array;
}

export interface ValidateDictionaryChangerProps
  extends ValidateDictionaryProps {
  value: string | Uint8Array;
  ttl?: CollectionTtl;
}

export interface ValidateSetProps extends ValidateCacheProps {
  setName: string;
}

export function ItBehavesLikeItValidatesCacheName(
  getResponse: (props: ValidateCacheProps) => Promise<Response>
) {
  it('validates its cache name', async () => {
    const response = await getResponse({cacheName: '   '});

    expect((response as Error).errorCode()).toEqual(
      MomentoErrorCode.INVALID_ARGUMENT_ERROR
    );
  });
}
