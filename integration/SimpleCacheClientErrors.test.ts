// import {v4} from 'uuid';
// import {SimpleCacheClient} from '../src';
// import {AlreadyExistsError, NotFoundError} from '../src/Errors';

// const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
// if (!AUTH_TOKEN) {
//   throw new Error('Missing required env var TEST_AUTH_TOKEN');
// }

// describe('SimpleCacheClient.ts Integration Tests - verify thrown errors', () => {
//   let momento: SimpleCacheClient;
//   beforeAll(() => {
//     momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//   });
//   it('should throw CacheNotFoundError if deleting a non-existent cache', async () => {
//     const cacheName = v4();
//     await expect(momento.deleteCache(cacheName)).rejects.toThrow(NotFoundError);
//   });

//   it('should throw CacheAlreadyExistsError if trying to create a cache that already exists', async () => {
//     const cacheName = v4();
//     await momento.createCache(cacheName);
//     await expect(momento.createCache(cacheName)).rejects.toThrow(
//       AlreadyExistsError
//     );
//     await momento.deleteCache(cacheName);
//   });
// });
