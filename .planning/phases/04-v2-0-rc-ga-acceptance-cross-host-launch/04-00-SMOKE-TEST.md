---
artifact: smoke-test-evidence
phase: 04
plan: "00"
run_date: "2026-05-27"
tarball: design-os-2.0.0-beta.0.tgz
tarball_size_kb: 213
tarball_files: 150
---

# 04-00 Smoke Test — npm pack + install-in-tmpdir + install command verification

Evidence for Task 4 (npm publish gate). All 6 steps executed and recorded below.

---

## Deviation caught and auto-fixed during smoke test

**Rule 1 bug fixed: `eval-bundle-sufficiency.mjs` used a static top-level import**

During Step 4 of the first smoke-test run, `design-os --version` crashed with:
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
SMOKE_DIR=/tmp/design-os-smoke-QQdU

cd <repo-root>
npm pack --pack-destination /tmp/design-os-smoke-QQdU
```

**Result:**
- Tarball name: `design-os-2.0.0-beta.0.tgz`
- Package size: 213.5 kB (package/wire size) | 746.2 kB unpacked
- Total files: 150
- Well under the 5 MB limit.

**PASS**

---

## Step 2: Inspect tarball contents — PASS

```bash
tar -tzf /tmp/design-os-smoke-QQdU/design-os-2.0.0-beta.0.tgz | sort
```

### Required files — all present:

| File | Status |
|------|--------|
| `package/bin/design-os.mjs` | PASS |
| `package/assets/scripts/cli/install.mjs` | PASS |
| `package/skills/design/SKILL.md` | PASS |
| `package/schemas/dist/*.v1.json` | PASS |
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
mkdir -p /tmp/design-os-smoke-QQdU/install-target
npm install --prefix /tmp/design-os-smoke-QQdU/install-target \
  /tmp/design-os-smoke-QQdU/design-os-2.0.0-beta.0.tgz
```

**Result:** `added 394 packages in 8s` — exit code 0, no errors.

**PASS**

---

## Step 4: Run from installed location — PASS

Binary path after `--prefix` install: `/tmp/design-os-smoke-QQdU/install-target/node_modules/.bin/design-os`

Note: `--prefix` creates the binary at `node_modules/.bin/`, not at `<prefix>/bin/`. For `-g` global installs the binary lands in the global bin dir.

### `design-os --version`
```
2.0.0-beta.0
```
**PASS**

### `design-os --help` (key commands verified present)
All dispatcher subcommands listed:
- `apply`, `audit`, `budget-check`, `design`, `design-md-validate`, `excalidraw-render`, `gate`, `handoff-bundle`, `init`, `install` (NEW), `install-hooks`, `lint-spine-linearity`, `manifest-md`, `migrate`, `override-banner`, `preview`, `promote-inferred`, `recover`, `resume`, `reverse-engineer`, `scan`, `stage-recurrence-evidence`, `state-machine-emit`, `validate`, `verify`, `verify-golden`, `eval bundle-sufficiency`, `eval coexistence`, `eval skillgrade`

**PASS**

### `design-os install --help`
```
Usage: design-os install [options]

Install the design-os SKILL.md package into your host skills directory
(~/.claude/skills/design-os by default)

Options:
  --target <path>  Override install target base directory (default: ~/.claude/skills)
  --force          Skip the overwrite warning if target already exists (default: false)
  --dry-run        Show what would be copied without writing any files (default: false)
  -h, --help       display help for command
```
All three flags (`--target`, `--force`, `--dry-run`) present.

**PASS**

---

## Step 5: End-to-end install command — PASS

```bash
FAKE_HOME=/tmp/design-os-smoke-QQdU/fake-home
mkdir -p $FAKE_HOME

HOME=$FAKE_HOME /tmp/design-os-smoke-QQdU/install-target/node_modules/.bin/design-os install
```

**Output:**
```
Installed design-os skill to: /tmp/design-os-smoke-QQdU/fake-home/.claude/skills/design-os

Restart your Claude Code session (or run /reload-skills if available) to pick up the new skill.
```

### SKILL.md existence:
```
/tmp/design-os-smoke-QQdU/fake-home/.claude/skills/design-os/SKILL.md — EXISTS
```
**PASS**

### File integrity (sha256):
```
Source:    7b20f60f7bd550ee47270ffea1f1334d91de6c22a9949b8858417736c430741c
Installed: 7b20f60f7bd550ee47270ffea1f1334d91de6c22a9949b8858417736c430741c
```
Hashes match — byte-identical.

**PASS**

---

## Step 6: Cleanup — PASS

Smoke dir `/tmp/design-os-smoke-QQdU` cleaned up after evidence recorded.

**PASS**

---

## Summary

| Step | Description | Result |
|------|-------------|--------|
| 1 | npm pack — tarball <5 MB | PASS (213 kB) |
| 2 | Tarball contents — whitelist only, no secrets | PASS |
| 3 | npm install from tarball in tmpdir | PASS |
| 4 | design-os --version + --help + install --help from installed binary | PASS |
| 5 | design-os install (HOME override) creates SKILL.md byte-identically | PASS |
| 6 | Cleanup | PASS |

**All 6 steps: PASS**

The package is ready for `npm publish --tag beta`.
