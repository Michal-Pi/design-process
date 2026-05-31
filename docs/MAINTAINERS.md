# Maintainers

## Anthropic-Labs watcher

The Anthropic-Labs watcher monitors `anthropics/skills` releases, the Anthropic blog RSS,
and Claude Design release notes daily for competitive-watch keywords.

- **Primary:** Michal Pilawski ([@Michal-Pi](https://github.com/Michal-Pi) · michal.pilawski@gmail.com)
- **Backup:** @Michal-Pi (same maintainer until a backup is designated)
- **Weekly review cadence:** Friday
- **Review checklist:**
  - Open `[competitive-watch]` issues created by the watcher
  - Evaluate each hit for design-process overlap (≥3 of: research → IA → low-fi → interactions → tokens → DS-extraction)
  - If overlap ≥3, invoke [docs/RAPID-RESPONSE.md](RAPID-RESPONSE.md) 72-hour response plan
  - If no overlap, close the issue with a short note explaining why
  - Mark the `Anthropic Watcher: Status Tracker` issue with your review date

**Note:** Owner contact filled in as part of Plan 04-04 (v2.0 RC). The watcher GitHub Actions cron is live from week 1
per D-30 and GTM-06 (Phase 1 success criterion).

## Schemas + Migrations

Schema changes that bump the major version require a migration script under `schemas/migrations/`.
The CI `schema-migration-guard.yml` workflow enforces this automatically.

- **Owner:** The engineer who bumps the schema version opens the migration PR.
- **See:** `.github/workflows/schema-migration-guard.yml`

## Trust posture

All user-visible copy changes require a copy review pass against the
[copy review checklist](COPY-REVIEW-CHECKLIST.md).

- **Copy reviewer:** Michal Pilawski ([@Michal-Pi](https://github.com/Michal-Pi))
- **See:** [docs/COPY-REVIEW-CHECKLIST.md](COPY-REVIEW-CHECKLIST.md)
- **See also:** [docs/TRUST-POSTURE.md](TRUST-POSTURE.md) for the full trust posture binding
