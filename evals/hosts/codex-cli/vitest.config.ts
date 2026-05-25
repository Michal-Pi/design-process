import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      HOST_PROFILE: 'codex-cli',
    },
  },
});
