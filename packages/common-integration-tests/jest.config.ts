import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/src/momento-jest-matchers.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 120000,
};

export default config;
