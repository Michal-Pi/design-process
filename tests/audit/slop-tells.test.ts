// tests/audit/slop-tells.test.ts
// Tests for assets/scripts/audit/slop-tells.mjs
// TDD RED phase: verify behavior contract from PLAN.md T-02-05-A
//
// Implements: D-46, AUDIT-01, AUDIT-03

import { describe, it, expect } from 'vitest';
import { detectSlopTells } from '../../assets/scripts/audit/slop-tells.mjs';

describe('detectSlopTells', () => {
  it('detects rainbow gradient → 5a-slop-001 ERROR', async () => {
    const css = `
      .hero {
        background: linear-gradient(red, orange, yellow, green, blue, purple);
      }
    `;
    const findings = await detectSlopTells(css, 'src/components/Hero.css');
    expect(findings.length).toBeGreaterThan(0);
    const f = findings.find(f => f.id === '5a-slop-001');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('ERROR');
    expect(f?.message).toContain('Hero.css');
  });

  it('detects Inter-default font → 5a-slop-002 WARNING', async () => {
    const css = `
      body {
        font-family: 'Inter', sans-serif;
      }
    `;
    const findings = await detectSlopTells(css, 'src/styles/global.css');
    const f = findings.find(f => f.id === '5a-slop-002');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('WARNING');
  });

  it('detects glass-stack (backdrop-filter blur) → 5a-slop-003 WARNING', async () => {
    const css = `
      .card {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.2);
      }
    `;
    const findings = await detectSlopTells(css, 'src/components/Card.css');
    const f = findings.find(f => f.id === '5a-slop-003');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('WARNING');
  });

  it('detects three-column-grid → 5a-slop-004 INFO', async () => {
    const css = `
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }
    `;
    const findings = await detectSlopTells(css, 'src/layouts/Grid.css');
    const f = findings.find(f => f.id === '5a-slop-004');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('INFO');
  });

  it('detects linear-gradient with 3+ stops (non-rainbow) → 5a-slop-005 WARNING', async () => {
    const css = `
      .section {
        background: linear-gradient(to bottom, #fff, #eee, #ddd);
      }
    `;
    const findings = await detectSlopTells(css, 'src/styles/section.css');
    const f = findings.find(f => f.id === '5a-slop-005');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('WARNING');
  });

  it('returns empty array for clean CSS with semantic tokens', async () => {
    const css = `
      .button {
        background: var(--color-primary);
        color: var(--color-on-primary);
        font-family: var(--font-body);
      }
      .container {
        display: flex;
        gap: var(--spacing-4);
      }
    `;
    const findings = await detectSlopTells(css, 'src/components/Button.css');
    expect(findings).toHaveLength(0);
  });

  it('each finding has id, severity, message, fixRecipe, suppressWith', async () => {
    const css = `font-family: 'Inter', sans-serif;`;
    const findings = await detectSlopTells(css, 'test.css');
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f).toHaveProperty('id');
      expect(f).toHaveProperty('severity');
      expect(f).toHaveProperty('message');
      expect(f).toHaveProperty('fixRecipe');
      expect(f).toHaveProperty('suppressWith');
    }
  });

  it('detects Inter in double-quoted font-family', async () => {
    const css = `body { font-family: "Inter", sans-serif; }`;
    const findings = await detectSlopTells(css, 'test.css');
    const f = findings.find(f => f.id === '5a-slop-002');
    expect(f).toBeDefined();
  });
});
