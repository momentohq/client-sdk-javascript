import type {Config} from 'jest';

const config: Config = {
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 30000,
};

export default config;
