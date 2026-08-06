/**
 * exploreCategories' per-item `accentColor` values (`src/features/explore/
 * exploreCategories.ts`) each become a full LinearGradient stop directly
 * under `ExploreFeaturedCard`'s large white bold title (24px/800 — WCAG
 * "large text") whenever that category is the recency-based featured
 * category. That's a stronger legibility bar than `themes.ts`'s own
 * `BibleTheme.accent`, which only ever sits behind small icons/text on
 * `colors.card` — never as a full-bleed gradient under large white text.
 *
 * A first attempt at this palette used the "obvious" Tailwind-500 shade for
 * every category; 6 of the 11 failed WCAG AA large-text (≥3:1) against
 * white — one (`kids`'s original yellow-400) as low as 1.53:1. This locks
 * the fix (deepened shades / a swapped hue) so a future palette tweak can't
 * silently reintroduce an unreadable hero title, mirroring the enumeration
 * style `themeHeaderContrast.test.ts` already uses for the app's own header
 * gradients.
 */
import {contrastRatio, meetsAA} from '../src/lib/a11y/contrast';
import {EXPLORE_CATEGORIES} from '../src/features/explore/exploreCategories';

const WHITE = '#FFFFFF';

describe('exploreCategories accentColor — hero title stays legible (WCAG AA large text)', () => {
  it.each(
    EXPLORE_CATEGORIES.map(c => ({id: c.id, accentColor: c.accentColor})),
  )(
    '$id: white bold hero title clears AA large text (≥3:1) against its accentColor',
    ({accentColor}) => {
      expect(meetsAA(contrastRatio(WHITE, accentColor), true)).toBe(true);
    },
  );

  it('every accentColor is a distinct hex (no two categories share an identity color)', () => {
    const colors = EXPLORE_CATEGORIES.map(c => c.accentColor);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
