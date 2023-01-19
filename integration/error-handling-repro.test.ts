import {v4} from 'uuid';
import {cache} from '@gomomento/generated-types';
import grpcCache = cache.cache_client;
import {SetupIntegrationTest} from './integration-setup';
import {ChannelCredentials, Metadata} from '@grpc/grpc-js';
import {
  CacheSetAddElement,
  CacheSetRemoveElement,
  MomentoErrorCode,
} from '../src';
import {decodeJwt} from '../src/utils/jwt';
import {Status} from '@grpc/grpc-js/build/src/constants';

const {Momento, IntegrationTestCacheName} = SetupIntegrationTest();

const LOL_BYTE_ARRAY = Uint8Array.of(108, 111, 108);
const FOO_BYTE_ARRAY = Uint8Array.of(102, 111, 111);

describe('Integration tests for convenience operations on sets datastructure', () => {
  it('i should see unavailable instead of deadline_exceeded with raw client', () => {
    const authToken = process.env['TEST_AUTH_TOKEN'];
    if (!authToken) {
      throw new Error('Missing required environment variable TEST_AUTH_TOKEN');
    }
    const claims = decodeJwt(authToken);
    const cacheEndpoint = claims.c;

    const client = new grpcCache.ScsClient(
      cacheEndpoint,
      ChannelCredentials.createSsl()
    );
    const request = new grpcCache._SetUnionRequest({
      set_name: FOO_BYTE_ARRAY,
      elements: [LOL_BYTE_ARRAY],
    });
    const metadata = new Metadata();
    metadata.set('cache', IntegrationTestCacheName);
    metadata.add('Authorization', authToken);

    client.SetUnion(request, metadata, (err, resp) => {
      expect(err).toBeTruthy();
      expect(err?.code).toBeTruthy();
      expect(err?.code).toEqual(Status.UNAVAILABLE);
    });
  });
  it('i should see unavailable instead of deadline_exceeded with our sdk client', async () => {
    const setName = v4();
    const addResponse = await Momento.setAddElement(
      IntegrationTestCacheName,
      setName,
      LOL_BYTE_ARRAY
    );
    expect(addResponse).toBeInstanceOf(CacheSetAddElement.Error);
    expect((addResponse as CacheSetRemoveElement.Error).errorCode()).toEqual(
      MomentoErrorCode.SERVER_UNAVAILABLE
    );
  });
});
