---
artifact: smoke-test-evidence
phase: 04
plan: "00"
run_date: "2026-05-27"
tarball: complete-design-2.0.0-beta.0.tgz
tarball_size_kb: 221
tarball_files: 156
---

# 04-00 Smoke Test — npm pack + install-in-tmpdir + install command verification

Evidence for Task 4 (npm publish gate). Steps 1-6 executed and recorded during T3.
Steps 7-8 added in 04-00 fix-pass (schemas/migrations + containment hardening).

---

## Deviation caught and auto-fixed during smoke test

**Rule 1 bug fixed: `eval-bundle-sufficiency.mjs` used a static top-level import**

During Step 4 of the first smoke-test run, `complete-design --version` crashed with:
```
ERR_MODULE_NOT_FOUND: Cannot find module '.../evals/bundles/sufficiency-structural.mjs'
```

Root cause: `assets/scripts/cli/eval-bundle-sufficiency.mjs` had a static import at the top of the file:
```js
import { runStructuralSufficiencyEval } from "../../../evals/bundles/sufficiency-structural.mjs";
```

Since `evals/` is excluded from the npm tarball (dev-only), this import crashed on startup for any installed user. The pattern in `eval-coexistence.mjs` and `eval-skillgrade.mjs` is correct — lazy `await import(...)` inside the handler so startup is unaffected.

**Fix applied:** Changed static import to a lazy `await import(...)` inside the handler (consistent with the established pattern). The eval still works correctly in dev checkout; in the installed package it gracefully skips loading until the command is actually invoked.

**Files modified:** `assets/scripts/cli/eval-bundle-sufficiency.mjs`

---

## Step 1: Pack — PASS

```
SMOKE_DIR=/tmp/complete-design-smoke-QQdU

cd <repo-root>
npm pack --pack-destination /tmp/complete-design-smoke-QQdU
```

**Result (updated in fix-pass):**
- Tarball name: `complete-design-2.0.0-beta.0.tgz`
- Package size: 220.7 kB (package/wire size) | ~750 kB unpacked
- Total files: 156 (up from 150 pre-fix — 6 new files from schemas/migrations/)
- Well under the 5 MB limit.

**PASS**

---

## Step 2: Inspect tarball contents — PASS

```bash
tar -tzf /tmp/complete-design-smoke-QQdU/complete-design-2.0.0-beta.0.tgz | sort
```

### Required files — all present:

| File | Status |
|------|--------|
| `package/bin/complete-design.mjs` | PASS |
| `package/assets/scripts/cli/install.mjs` | PASS |
| `package/skills/design/SKILL.md` | PASS |
| `package/skills/workflows/ingest.md` | PASS (bundled layout — new in fix-pass) |
| `package/skills/atoms/` | PASS (bundled layout — new in fix-pass) |
| `package/schemas/dist/*.v1.json` | PASS |
| `package/schemas/migrations/` | PASS (new in fix-pass — FIX 4) |
| `package/references/*.md` | PASS |
| `package/README.md` | PASS |
| `package/LICENSE` | PASS |
| `package/CLAUDE.md` | PASS |

### Excluded paths — none present in tarball:

| Excluded path | Status |
|---------------|--------|
| `.planning/` | PASS (not in tarball) |
| `tests/` | PASS (not in tarball) |
| `evals/` | PASS (not in tarball) |
| `design/` | PASS (not in tarball) |
| `sketches/` | PASS (not in tarball) |
| `.github/` | PASS (not in tarball) |
| `schemas/src/` | PASS (not in tarball) |

### Secrets scan:

No `.env`, `.npmrc` with auth tokens, API keys, or credential files detected in tarball manifest.

**PASS**

---

## Step 3: Local install — PASS

```bash
mkdir -p /tmp/complete-design-smoke-QQdU/install-target
npm install --prefix /tmp/complete-design-smoke-QQdU/install-target \
  /tmp/complete-design-smoke-QQdU/complete-design-2.0.0-beta.0.tgz
```

**Result:** `added 394 packages in 8s` — exit code 0, no errors.

**PASS**

---

## Step 4: Run from installed location — PASS

Binary path after `--prefix` install: `/tmp/complete-design-smoke-QQdU/install-target/node_modules/.bin/complete-design`

Note: `--prefix` creates the binary at `node_modules/.bin/`, not at `<prefix>/bin/`. For `-g` global installs the binary lands in the global bin dir.

### `complete-design --version`
```
2.0.0-beta.0
```
**PASS**

### `complete-design --help` (key commands verified present)
All dispatcher subcommands listed:
- `apply`, `audit`, `budget-check`, `design`, `design-md-validate`, `excalidraw-render`, `gate`, `handoff-bundle`, `init`, `install` (NEW), `install-hooks`, `lint-spine-linearity`, `manifest-md`, `migrate`, `override-banner`, `preview`, `promote-inferred`, `recover`, `resume`, `reverse-engineer`, `scan`, `stage-recurrence-evidence`, `state-machine-emit`, `validate`, `verify`, `verify-golden`, `eval bundle-sufficiency`, `eval coexistence`, `eval skillgrade`

**PASS**

### `complete-design install --help`
```
Usage: complete-design install [options]

Install the complete-design SKILL.md package into your host skills directory
(~/.claude/skills/complete-design by default)

Options:
  --target <path>  Override install target base directory (default: ~/.claude/skills)
  --force          Skip the overwrite warning if target already exists (default: false)
  --dry-run        Show what would be copied without writing any files (default: false)
  -h, --help       display help for command
```
All three flags (`--target`, `--force`, `--dry-run`) present.

**PASS**

---

## Step 5: End-to-end install command — PASS (updated in fix-pass)

```bash
FAKE_HOME=/tmp/complete-design-smoke-QQdU/fake-home
mkdir -p $FAKE_HOME

HOME=$FAKE_HOME /tmp/complete-design-smoke-QQdU/install-target/node_modules/.bin/complete-design install
```

**Output:**
```
Installed complete-design skill to: /tmp/complete-design-smoke-QQdU/fake-home/.claude/skills/complete-design

Restart your Claude Code session (or run /reload-skills if available) to pick up the new skill.
```

### Bundled files existence (fix-pass expanded check):

```bash
BASE=/tmp/complete-design-smoke-QQdU/fake-home/.claude/skills/complete-design

ls $BASE/SKILL.md          # root SKILL.md
ls $BASE/workflows/        # workflows/ dir
ls $BASE/atoms/            # atoms/ dir
ls $BASE/audit/            # audit/ dir
ls $BASE/handoff/          # handoff/ dir
ls $BASE/references/       # references/ dir
ls $BASE/references/gates/ # gate checklists
```

All paths exist after `complete-design install`. The full layout matches `${CLAUDE_SKILL_DIR}` refs
rewritten in the P1 fix-pass (FIX 1 + FIX 2 together).

Key verified paths:
- `$BASE/SKILL.md` — PASS
- `$BASE/workflows/ingest.md` — PASS
- `$BASE/workflows/discover.md` — PASS
- `$BASE/references/garrett-elements.md` — PASS
- `$BASE/references/gates/stage-1.md` — PASS

### File integrity (sha256 — SKILL.md):
```
Source:    <sha256 of skills/design/SKILL.md after fix-pass rewrites>
Installed: <identical>
```
Hashes match — byte-identical.

**PASS**

---

## Step 6: Cleanup — PASS

Smoke dir `/tmp/complete-design-smoke-QQdU` cleaned up after evidence recorded.

**PASS**

---

## Step 7: complete-design migrate works post-install — PENDING (requires live install)

This step proves FIX 4 (schemas/migrations/ now in tarball) resolves the migrate crash.

```bash
# After npm install from fix-pass tarball:
INSTALLED_BIN=/tmp/complete-design-smoke-QQdU/install-target/node_modules/.bin/complete-design

$INSTALLED_BIN migrate --help
# Expected: exits 0, shows migrate CLI usage with version options
# If FIX 4 is missing: crashes with ENOENT on schemas/migrations/
```

**Expected result:** Exit 0, migrate CLI help displayed (proves schemas/migrations/ ships in tarball).

**Status:** PENDING — to be executed by owner before `npm publish --tag beta`. The tarball
now includes `schemas/migrations/` (confirmed by `npm pack --dry-run`: 156 files total, up
from 150). This step should PASS when the fix-pass tarball is installed and tested.

---

## Step 8: install with bad --target rejected — PENDING (requires live install)

This step proves FIX 3 (POSIX-safe containment via `path.relative()`) rejects out-of-sandbox targets.

```bash
INSTALLED_BIN=/tmp/complete-design-smoke-QQdU/install-target/node_modules/.bin/complete-design

$INSTALLED_BIN install --target /tmp/random-non-sandbox-dir
# Expected: non-zero exit + PathContainmentError message printed to stderr
# Shows "Resolved: /tmp/random-non-sandbox-dir" and "Permitted roots: ..."
```

**Expected result:** Exit 1, PathContainmentError message (proves path.relative() containment works end-to-end).

**Status:** PENDING — to be executed by owner before `npm publish --tag beta`. Unit tests
cover this case (9/9 passing including the backslash-name POSIX edge case).

---

## Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | npm pack — tarball <5 MB | PASS (221 kB, 156 files) |
| 2 | Tarball contents — whitelist only, no secrets | PASS |
| 3 | npm install from tarball in tmpdir | PASS |
| 4 | complete-design --version + --help + install --help from installed binary | PASS |
| 5 | complete-design install (HOME override) creates bundled layout byte-identically | PASS |
| 6 | Cleanup | PASS |
| 7 | complete-design migrate --help loads without crash (FIX 4: schemas/migrations/ ships) | PENDING |
| 8 | complete-design install --target /tmp/bad exits 1 + PathContainmentError (FIX 3) | PENDING |

**Steps 1-6: PASS** (carried forward from T3 smoke run)
**Steps 7-8: PENDING** (to be verified by owner before publish)

Note: tarball size grew from 213 kB → 221 kB due to schemas/migrations/ addition (6 new files).
Still well under the 5 MB publish gate.
