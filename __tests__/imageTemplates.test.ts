/**
 * Tests for the pure share-image template catalog + aspect helpers (Sprint 56).
 */
import {
  SHARE_TEMPLATES,
  FREE_TEMPLATES,
  PREMIUM_TEMPLATES,
  SHARE_ASPECTS,
  ASPECT_RATIO,
  isTemplateUnlocked,
  aspectHeight,
  type ShareTemplate,
} from '../src/features/share/imageTemplates';

/** The 10 originals shipped since Sprint 3 — must stay free + present. */
const ORIGINAL_FREE_IDS = [
  'classic',
  'sunrise',
  'nature',
  'spiritual',
  'ocean',
  'royal',
  'midnight',
  'minimal',
  'aura',
  'rose',
];

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('SHARE_TEMPLATES catalog', () => {
  it('keeps the original 10 free templates (zero regression)', () => {
    const freeIds = FREE_TEMPLATES.map(t => t.id);
    expect(freeIds).toEqual(ORIGINAL_FREE_IDS);
    FREE_TEMPLATES.forEach(t => expect(t.tier).toBe('free'));
  });

  it('adds a premium designer set on top of the free ones', () => {
    expect(PREMIUM_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    PREMIUM_TEMPLATES.forEach(t => expect(t.tier).toBe('premium'));
  });

  it('partitions exactly into free + premium', () => {
    expect(FREE_TEMPLATES.length + PREMIUM_TEMPLATES.length).toBe(
      SHARE_TEMPLATES.length,
    );
  });

  it('lists the free templates before the premium ones', () => {
    const firstPremium = SHARE_TEMPLATES.findIndex(t => t.tier === 'premium');
    const lastFree = SHARE_TEMPLATES.map(t => t.tier).lastIndexOf('free');
    expect(firstPremium).toBeGreaterThan(lastFree);
  });

  it('has unique ids', () => {
    const ids = SHARE_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template has ≥2 valid hex stops, a hex textColor and an icon', () => {
    SHARE_TEMPLATES.forEach((t: ShareTemplate) => {
      expect(t.colors.length).toBeGreaterThanOrEqual(2);
      t.colors.forEach(c => expect(c).toMatch(HEX));
      expect(t.textColor).toMatch(HEX);
      expect(typeof t.icon).toBe('string');
      expect(t.icon.length).toBeGreaterThan(0);
    });
  });
});

describe('isTemplateUnlocked', () => {
  const free = SHARE_TEMPLATES.find(t => t.tier === 'free')!;
  const premium = SHARE_TEMPLATES.find(t => t.tier === 'premium')!;

  it('free templates are always unlocked', () => {
    expect(isTemplateUnlocked(free, false)).toBe(true);
    expect(isTemplateUnlocked(free, true)).toBe(true);
  });

  it('premium templates are locked without premium, unlocked with it', () => {
    expect(isTemplateUnlocked(premium, false)).toBe(false);
    expect(isTemplateUnlocked(premium, true)).toBe(true);
  });
});

describe('aspect presets', () => {
  it('exposes square/portrait/story in order', () => {
    expect(SHARE_ASPECTS).toEqual(['square', 'portrait', 'story']);
  });

  it('square is 1:1 so the default card keeps its current size', () => {
    expect(ASPECT_RATIO.square).toBe(1);
    expect(aspectHeight('square', 360)).toBe(360);
  });

  it('portrait is 4:5 (height = width × 1.25)', () => {
    expect(aspectHeight('portrait', 360)).toBe(450);
  });

  it('story is 9:16 (height = width × 16/9, rounded)', () => {
    expect(aspectHeight('story', 360)).toBe(Math.round(360 * (16 / 9)));
  });

  it('guards non-finite / non-positive widths → 0', () => {
    expect(aspectHeight('square', 0)).toBe(0);
    expect(aspectHeight('square', -10)).toBe(0);
    expect(aspectHeight('story', Number.NaN)).toBe(0);
    expect(aspectHeight('portrait', Number.POSITIVE_INFINITY)).toBe(0);
  });
});
