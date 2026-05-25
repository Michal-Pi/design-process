// tests/audit/stage-5b-pr.test.ts
// Tests for assets/scripts/audit/stage-5b-pr.mjs
// TDD RED phase: verify behavior contract from PLAN.md T-02-05-A
//
// Implements: D-45, AUDIT-01

import { describe, it, expect } from 'vitest';
import { detectStage5bPrIssues } from '../../assets/scripts/audit/stage-5b-pr.mjs';

interface Finding {
  id: string;
  severity: string;
  message: string;
}

describe('detectStage5bPrIssues', () => {
  it('detects evidence:validated in tokens.json diff → 5b-evidence-001 BLOCKER', () => {
    const content = `
      {
        "$extensions": {
          "design-os": {
            "evidence": "validated"
          }
        }
      }
    `;
    const findings = detectStage5bPrIssues('design/tokens.json', content);
    const f = findings.find((f: Finding) => f.id === '5b-evidence-001');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('BLOCKER');
  });

  it('detects evidence:proto in tokens.json diff → 5b-evidence-001 BLOCKER', () => {
    const content = `"evidence": "proto"`;
    const findings = detectStage5bPrIssues('design/tokens.json', content);
    const f = findings.find((f: Finding) => f.id === '5b-evidence-001');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('BLOCKER');
  });

  it('detects $schema mismatch (no design-tokens.org URL) → 5b-schema-001 WARNING', () => {
    const content = `
      {
        "$schema": "https://example.com/wrong-schema.json",
        "$description": "tokens"
      }
    `;
    const findings = detectStage5bPrIssues('design/tokens.json', content);
    const f = findings.find((f: Finding) => f.id === '5b-schema-001');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('WARNING');
  });

  it('returns empty for clean tokens.json diff with INFERRED evidence', () => {
    const content = `
      {
        "$schema": "https://www.designtokens.org/schema/tokens.json",
        "$extensions": {
          "design-os": {
            "evidence": "INFERRED"
          }
        }
      }
    `;
    const findings = detectStage5bPrIssues('design/tokens.json', content);
    expect(findings.find((f: Finding) => f.id === '5b-evidence-001')).toBeUndefined();
    expect(findings.find((f: Finding) => f.id === '5b-schema-001')).toBeUndefined();
  });

  it('each finding has id, severity, message', () => {
    const content = `"evidence": "validated"`;
    const findings = detectStage5bPrIssues('design/tokens.json', content);
    for (const f of findings) {
      expect(f).toHaveProperty('id');
      expect(f).toHaveProperty('severity');
      expect(f).toHaveProperty('message');
    }
  });
});
