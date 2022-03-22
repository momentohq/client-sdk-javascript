// import {v4} from 'uuid';
// import * as fs from 'fs';
// import * as os from 'os';
// import {SimpleCacheClient} from '../src';
// import {AlreadyExistsError} from '../src/Errors';

// const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
// if (!AUTH_TOKEN) {
//   throw new Error('Missing required env var TEST_AUTH_TOKEN');
// }

// const momentoDirName = `${os.homedir()}/.momento-test`;
// const credsFilePath = `${momentoDirName}/credentials`;
// const createSystemCredentials = (profile?: string) => {
//   const profileName = profile ?? 'default';
//   if (profile) {
//     process.env.MOMENTO_PROFILE = profileName;
//   }
//   if (!fs.existsSync(momentoDirName)) {
//     fs.mkdirSync(momentoDirName);
//   } else {
//     throw new Error(`${momentoDirName} directory exists.
// These integration tests test reading profiles from disk, and create a ~/.momento-test directory to test this.`);
//   }
//   fs.writeFileSync(
//     credsFilePath,
//     `[${profileName}]
// token = "${AUTH_TOKEN}"`
//   );
// };

// const removeSystemCredentials = () => {
//   fs.rmSync(momentoDirName, {
//     force: true,
//     recursive: true,
//   });
// };

// describe('SimpleCacheClient.ts Integration Tests - verify auth token usage from ~/.momento-test/credentials', () => {
//   beforeEach(() => {
//     removeSystemCredentials();
//   });
//   it('should use the default auth token from ~/.momento-test/credentials', async () => {
//     createSystemCredentials();
//     const cacheName = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.createCache(cacheName);
//     await expect(momento.createCache(cacheName)).rejects.toThrow(
//       AlreadyExistsError
//     );
//     await momento.deleteCache(cacheName);
//   });

//   it('should use the MOMENTO_PROFILE auth token from ~/.momento-test/credentials', async () => {
//     createSystemCredentials('profile2');
//     const cacheName = v4();
//     const momento = new SimpleCacheClient(AUTH_TOKEN, 1111);
//     await momento.createCache(cacheName);
//     await expect(momento.createCache(cacheName)).rejects.toThrow(
//       AlreadyExistsError
//     );
//     await momento.deleteCache(cacheName);
//   });
// });
