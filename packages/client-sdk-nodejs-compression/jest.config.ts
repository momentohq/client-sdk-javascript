import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'node',
 roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 120000,
  // this reporter makes some things easier when searching canary logs because it logs
  // fail/success status for each test case on a single line. However it also swallows
  // most console output. Consider commenting out this line if you are debugging some
  // tests and need to see console output
  reporters: ["jest-spec-reporter"]
};

export default config;
