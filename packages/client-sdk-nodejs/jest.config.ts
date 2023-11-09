import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/webhooks.test.ts'],
  // testMatch: ['./test/integration/shared/webhooks.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 120000,
};

export default config;
