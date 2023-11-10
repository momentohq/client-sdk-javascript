import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: '@happy-dom/jest-environment',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 120000,
  setupFiles: ['<rootDir>/jest.setup.js']
};

export default config;
