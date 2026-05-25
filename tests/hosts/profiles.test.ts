// tests/hosts/profiles.test.ts
// RED: failing tests for host-profile workspaces (D-22)
// Task 3 - D-22: 3 host-profile vitest workspaces

import { describe, it, expect } from 'vitest';
import { stat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const HOSTS = ['claude-code', 'codex-cli', 'cursor'];

describe('host-profile workspaces: required files exist', () => {
  for (const host of HOSTS) {
    it(`evals/hosts/${host}/package.json exists`, async () => {
      await expect(stat(resolve(ROOT, `evals/hosts/${host}/package.json`))).resolves.toBeDefined();
    });

    it(`evals/hosts/${host}/vitest.config.ts exists`, async () => {
      await expect(stat(resolve(ROOT, `evals/hosts/${host}/vitest.config.ts`))).resolves.toBeDefined();
    });

    it(`evals/hosts/${host}/host-profile.test.ts exists`, async () => {
      await expect(stat(resolve(ROOT, `evals/hosts/${host}/host-profile.test.ts`))).resolves.toBeDefined();
    });
  }
});

describe('host-profile workspaces: package.json content', () => {
  for (const host of HOSTS) {
    it(`evals/hosts/${host}/package.json has correct name`, async () => {
      const content = JSON.parse(await readFile(resolve(ROOT, `evals/hosts/${host}/package.json`), 'utf-8'));
      expect(content.name).toContain(host);
    });

    it(`evals/hosts/${host}/package.json is private`, async () => {
      const content = JSON.parse(await readFile(resolve(ROOT, `evals/hosts/${host}/package.json`), 'utf-8'));
      expect(content.private).toBe(true);
    });
  }
});

describe('host-profile workspaces: vitest.config sets HOST_PROFILE', () => {
  for (const host of HOSTS) {
    it(`evals/hosts/${host}/vitest.config.ts sets HOST_PROFILE to ${host}`, async () => {
      const content = await readFile(resolve(ROOT, `evals/hosts/${host}/vitest.config.ts`), 'utf-8');
      expect(content).toContain('HOST_PROFILE');
      expect(content).toContain(host);
    });
  }
});

describe('root package.json workspaces', () => {
  it('package.json has workspaces field', async () => {
    const content = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf-8'));
    expect(content.workspaces).toBeDefined();
    expect(Array.isArray(content.workspaces)).toBe(true);
  });

  for (const host of HOSTS) {
    it(`workspaces includes evals/hosts/${host}`, async () => {
      const content = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf-8'));
      expect(content.workspaces).toContain(`evals/hosts/${host}`);
    });
  }
});
