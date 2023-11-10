/// <reference types="vitest" />
import {defineConfig} from 'vite';

export default defineConfig({
  test: {
    include: ['test/**/**/*.test.ts'],
    environment: 'happy-dom',
    testTimeout: 120000,
  },
});
