// evals/hosts/codex-cli/setup.ts
// Vitest setup: ensure process.cwd() points to the project root regardless of
// where the workspace is invoked from. This fixes the CWD resolution issue
// described in 02-VERIFICATION.md (D-53 WARNING) where host-profile tests use
// `resolve(process.cwd(), wfPath)` which resolves relative to the workspace
// subdir when run from evals/hosts/codex-cli/.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../..');

process.chdir(PROJECT_ROOT);
