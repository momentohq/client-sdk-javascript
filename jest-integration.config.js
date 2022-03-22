module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/integration'],
  testMatch: ['**/SimpleCacheClient.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
