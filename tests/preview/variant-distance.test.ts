// tests/preview/variant-distance.test.ts
// RED: failing tests for variant-distance.mjs
// Task 1 - PREV-05: 6-axis Stage 5a visual-style distance metric

import { describe, it, expect } from 'vitest';

describe('variant-distance: AXES', () => {
  it('exports AXES with exactly 6 axis names', async () => {
    const { AXES } = await import('../../assets/scripts/preview/variant-distance.mjs');
    expect(AXES).toHaveLength(6);
  });

  it('AXES contains the required 6 axis names', async () => {
    const { AXES } = await import('../../assets/scripts/preview/variant-distance.mjs');
    expect(AXES).toContain('hue');
    expect(AXES).toContain('saturation');
    expect(AXES).toContain('lightness');
    expect(AXES).toContain('typographyContrast');
    expect(AXES).toContain('spacingRhythm');
    expect(AXES).toContain('cornerRoundness');
  });
});

describe('variant-distance: distance()', () => {
  it('exports distance as a function', async () => {
    const { distance } = await import('../../assets/scripts/preview/variant-distance.mjs');
    expect(typeof distance).toBe('function');
  });

  it('distance between identical variants is 0', async () => {
    const { distance } = await import('../../assets/scripts/preview/variant-distance.mjs');
    const a = { hue: 0.5, saturation: 0.5, lightness: 0.5, typographyContrast: 0.5, spacingRhythm: 0.5, cornerRoundness: 0.5 };
    expect(distance(a, a)).toBe(0);
  });

  it('distance when only hue differs by 1 is approximately 1', async () => {
    const { distance } = await import('../../assets/scripts/preview/variant-distance.mjs');
    const a = { hue: 0, saturation: 0, lightness: 0, typographyContrast: 0, spacingRhythm: 0, cornerRoundness: 0 };
    const b = { hue: 1, saturation: 0, lightness: 0, typographyContrast: 0, spacingRhythm: 0, cornerRoundness: 0 };
    expect(distance(a, b)).toBeCloseTo(1, 5);
  });

  it('distance handles missing axis values as 0', async () => {
    const { distance } = await import('../../assets/scripts/preview/variant-distance.mjs');
    const a = { hue: 0.3 };
    const b = { hue: 0.3 };
    // All other axes missing; should not throw
    expect(() => distance(a as any, b as any)).not.toThrow();
  });

  it('distance is symmetric', async () => {
    const { distance } = await import('../../assets/scripts/preview/variant-distance.mjs');
    const a = { hue: 0.2, saturation: 0.4, lightness: 0.6, typographyContrast: 0.1, spacingRhythm: 0.8, cornerRoundness: 0.3 };
    const b = { hue: 0.9, saturation: 0.1, lightness: 0.2, typographyContrast: 0.7, spacingRhythm: 0.5, cornerRoundness: 0.6 };
    expect(distance(a, b)).toBeCloseTo(distance(b, a), 10);
  });
});

describe('variant-distance: Stage 3 structural deferred', () => {
  it('exports STAGE_3_STRUCTURAL_DEFERRED = true', async () => {
    const { STAGE_3_STRUCTURAL_DEFERRED } = await import('../../assets/scripts/preview/variant-distance.mjs');
    expect(STAGE_3_STRUCTURAL_DEFERRED).toBe(true);
  });

  it('stage3StructuralDistance throws with informative message', async () => {
    const { stage3StructuralDistance } = await import('../../assets/scripts/preview/variant-distance.mjs');
    expect(typeof stage3StructuralDistance).toBe('function');
    expect(() => stage3StructuralDistance()).toThrow(/Phase 3/i);
  });
});
