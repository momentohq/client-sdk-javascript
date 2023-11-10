/// <reference types="vitest" />
import {defineConfig} from 'vite';

export default defineConfig({
  test: {
    include: ['./test/unit/placeholder.test.ts'],
    environment: 'node',
    setupFiles: ['src/momento-vitest-matchers.ts'],
  },
});
