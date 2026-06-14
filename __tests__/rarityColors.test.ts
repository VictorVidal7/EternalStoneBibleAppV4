/**
 * Locks the live rarity palette extracted in Sprint 83 when the dead
 * `expandedDefinitions.ts` catalog was retired. AchievementCard maps the real
 * achievement tier onto these five rarities to pick the badge/glow hue.
 */
import {
  AchievementRarity,
  RARITY_COLORS,
  getRarityInfo,
} from '../src/lib/achievements/rarityColors';

const RARITIES: AchievementRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

describe('rarityColors', () => {
  it('defines all five rarities with a full colour set', () => {
    expect(Object.keys(RARITY_COLORS).sort()).toEqual([...RARITIES].sort());
    RARITIES.forEach(rarity => {
      const c = RARITY_COLORS[rarity];
      expect(c.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.gradient).toHaveLength(2);
      expect(c.glow).toMatch(/^rgba\(/);
    });
  });

  it('getRarityInfo picks the dark hue only in dark mode', () => {
    RARITIES.forEach(rarity => {
      const light = getRarityInfo(rarity, false);
      const dark = getRarityInfo(rarity, true);
      expect(light.color).toBe(RARITY_COLORS[rarity].light);
      expect(dark.color).toBe(RARITY_COLORS[rarity].dark);
      expect(light.gradient).toBe(RARITY_COLORS[rarity].gradient);
      expect(light.glow).toBe(RARITY_COLORS[rarity].glow);
    });
  });

  it('getRarityInfo defaults to the light hue', () => {
    expect(getRarityInfo('legendary').color).toBe(
      RARITY_COLORS.legendary.light,
    );
  });

  it('capitalizes the rarity label', () => {
    expect(getRarityInfo('epic').label).toBe('Epic');
    expect(getRarityInfo('common').label).toBe('Common');
  });
});
