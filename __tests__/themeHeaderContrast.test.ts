import {contrastRatio, meetsAA} from '../src/lib/a11y/contrast';
import {colorThemes} from '../src/hooks/useTheme';

/**
 * Screen headers across the app render their chrome — back arrow, title, and
 * action icons — as a hardcoded white (`#ffffff`) Ionicons row anchored at the
 * TOP of a LinearGradient whose stops come from each theme's `headerColors`.
 * White is correct only if that anchor region stays dark in every theme and at
 * every time of day; `onPrimary` can't be used there because it flips to dark
 * ink in dark mode (headers stay dark in dark mode).
 *
 * This locks the invariant that makes the hardcoded white legible: the FIRST
 * (top, darkest) stop of every header gradient clears WCAG AA for large/UI
 * text against white. A future palette tweak that lightens a header top would
 * fail here instead of silently washing out the header chrome.
 */
const WHITE = '#ffffff';
const TIMES = ['morning', 'afternoon', 'evening', 'night'] as const;

const cases = Object.entries(colorThemes).flatMap(([theme, def]) =>
  TIMES.map(time => ({
    name: `${theme} · ${time}`,
    topStop: def.gradients[time].headerColors[0],
  })),
);

describe('theme header chrome — white icons stay legible on the gradient top', () => {
  it.each(cases)(
    '$name: header top stop clears AA (large/UI) for white chrome',
    ({topStop}) => {
      expect(meetsAA(contrastRatio(WHITE, topStop), true)).toBe(true);
    },
  );
});
