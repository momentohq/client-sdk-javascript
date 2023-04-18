import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 60000,
};

export default config;
