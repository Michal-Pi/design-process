import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');

export default defineConfig({
  root: PROJECT_ROOT,
  test: {
    include: ['evals/hosts/cursor/**/*.test.ts'],
    setupFiles: ['evals/hosts/cursor/setup.ts'],
    env: {
      HOST_PROFILE: 'cursor',
    },
  },
});
