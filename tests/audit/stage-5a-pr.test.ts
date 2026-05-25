// tests/audit/stage-5a-pr.test.ts
// Tests for assets/scripts/audit/stage-5a-pr.mjs
// TDD RED phase: verify behavior contract from PLAN.md T-02-05-A
//
// Implements: D-45, AUDIT-01

import { describe, it, expect } from 'vitest';
import { detectStage5aPrIssues } from '../../assets/scripts/audit/stage-5a-pr.mjs';

describe('detectStage5aPrIssues', () => {
  it('detects raw hex value → 5a-token-001 WARNING', () => {
    const content = `
      .button {
        background: #1a2b3c;
        color: #fff;
      }
    `;
    const findings = detectStage5aPrIssues('src/components/Button.css', content);
    const f = findings.find(f => f.id === '5a-token-001');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('WARNING');
    expect(f?.message).toContain('Button.css');
  });

  it('detects hardcoded Tailwind color class → 5a-token-002 WARNING', () => {
    const content = `<button className="bg-blue-500 text-white hover:bg-blue-600">Click</button>`;
    const findings = detectStage5aPrIssues('src/components/Button.tsx', content);
    const f = findings.find(f => f.id === '5a-token-002');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('WARNING');
  });

  it('returns empty findings for clean CSS with custom properties', () => {
    const content = `
      .button {
        background: var(--color-primary);
        color: var(--color-on-primary);
      }
    `;
    const findings = detectStage5aPrIssues('src/components/Button.css', content);
    expect(findings).toHaveLength(0);
  });

  it('returns empty findings for clean TSX with semantic tokens', () => {
    const content = `<button className="bg-primary text-primary-foreground">Click</button>`;
    const findings = detectStage5aPrIssues('src/components/Button.tsx', content);
    expect(findings).toHaveLength(0);
  });

  it('detects multiple violations in one file', () => {
    const content = `
      .a { color: #ff0000; }
      .b { background: #abc; }
    `;
    const findings = detectStage5aPrIssues('test.css', content);
    // Both hex values should be detected — at least 1 finding
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every(f => f.id === '5a-token-001')).toBe(true);
  });

  it('each finding has id, severity, message', () => {
    const content = `.a { color: #ff0000; }`;
    const findings = detectStage5aPrIssues('test.css', content);
    for (const f of findings) {
      expect(f).toHaveProperty('id');
      expect(f).toHaveProperty('severity');
      expect(f).toHaveProperty('message');
    }
  });

  it('detects 3-char hex values', () => {
    const content = `.a { color: #f00; }`;
    const findings = detectStage5aPrIssues('test.css', content);
    expect(findings.find(f => f.id === '5a-token-001')).toBeDefined();
  });
});
