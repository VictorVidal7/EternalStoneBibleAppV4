/**
 * Sprint 54 — reader reading themes (pure module).
 */

import {
  READER_THEMES,
  READER_THEME_ORDER,
  PREMIUM_READER_THEMES,
  LEGACY_AUDIO_HIGHLIGHT,
  LEGACY_ON_HIGHLIGHT,
  isReaderTheme,
  resolveReaderTheme,
  isReaderThemeUnlocked,
  ReaderTheme,
} from '../src/styles/readerThemes';

const appColors = {
  background: '#APP_BG',
  surface: '#APP_SURFACE',
  text: '#APP_TEXT',
  textSecondary: '#APP_TEXT2',
  textTertiary: '#APP_TEXT3',
  border: '#APP_BORDER',
  primary: '#APP_PRIMARY',
  primaryDark: '#APP_PRIMARY_DARK',
  primaryLight: '#APP_PRIMARY_LIGHT',
  // A non-reading key that must always survive the merge.
  warning: '#APP_WARNING',
} as const;

describe('READER_THEME_ORDER', () => {
  it('lists system first then the reading palettes', () => {
    expect(READER_THEME_ORDER).toEqual([
      'system',
      'paper',
      'sepia',
      'night',
      'high-contrast',
      'musgo',
      'crepusculo',
      'niebla',
    ]);
  });

  it('every order entry has a defined palette slot', () => {
    READER_THEME_ORDER.forEach(theme => {
      expect(theme in READER_THEMES).toBe(true);
    });
  });
});

describe('READER_THEMES palettes', () => {
  it('system is null (falls through to the app theme)', () => {
    expect(READER_THEMES.system).toBeNull();
  });

  it.each([
    'paper',
    'sepia',
    'night',
    'high-contrast',
    'musgo',
    'crepusculo',
    'niebla',
  ] as ReaderTheme[])('%s palette defines every reading-surface key', theme => {
    const p = READER_THEMES[theme];
    expect(p).not.toBeNull();
    const keys = [
      'background',
      'surface',
      'text',
      'textSecondary',
      'textTertiary',
      'border',
      'primary',
      'primaryDark',
      'primaryLight',
      'audioHighlight',
      'onHighlight',
    ];
    const rec = p as unknown as Record<string, string>;
    keys.forEach(k => {
      expect(typeof rec[k]).toBe('string');
      expect(rec[k].length).toBeGreaterThan(0);
    });
  });
});

describe('isReaderTheme', () => {
  it('accepts the known themes', () => {
    expect(isReaderTheme('system')).toBe(true);
    expect(isReaderTheme('paper')).toBe(true);
    expect(isReaderTheme('sepia')).toBe(true);
    expect(isReaderTheme('night')).toBe(true);
    expect(isReaderTheme('high-contrast')).toBe(true);
    expect(isReaderTheme('musgo')).toBe(true);
    expect(isReaderTheme('crepusculo')).toBe(true);
    expect(isReaderTheme('niebla')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isReaderTheme('dark')).toBe(false);
    expect(isReaderTheme('')).toBe(false);
    expect(isReaderTheme(undefined)).toBe(false);
    expect(isReaderTheme(null)).toBe(false);
    expect(isReaderTheme(3)).toBe(false);
  });
});

describe('resolveReaderTheme', () => {
  it('system returns the app colors verbatim plus the legacy extras', () => {
    const resolved = resolveReaderTheme(appColors, 'system');
    expect(resolved.background).toBe('#APP_BG');
    expect(resolved.text).toBe('#APP_TEXT');
    expect(resolved.primary).toBe('#APP_PRIMARY');
    expect(resolved.warning).toBe('#APP_WARNING');
    expect(resolved.audioHighlight).toBe(LEGACY_AUDIO_HIGHLIGHT);
    expect(resolved.onHighlight).toBe(LEGACY_ON_HIGHLIGHT);
  });

  it('an unknown theme value falls back to system behaviour', () => {
    const resolved = resolveReaderTheme(appColors, 'galaxy' as ReaderTheme);
    expect(resolved.background).toBe('#APP_BG');
    expect(resolved.audioHighlight).toBe(LEGACY_AUDIO_HIGHLIGHT);
  });

  it('a concrete palette overrides the reading-surface keys', () => {
    const resolved = resolveReaderTheme(appColors, 'paper');
    const paper = READER_THEMES.paper!;
    expect(resolved.background).toBe(paper.background);
    expect(resolved.text).toBe(paper.text);
    expect(resolved.primary).toBe(paper.primary);
    expect(resolved.audioHighlight).toBe(paper.audioHighlight);
    expect(resolved.onHighlight).toBe(paper.onHighlight);
  });

  it('preserves non-reading app keys when a palette is applied', () => {
    const resolved = resolveReaderTheme(appColors, 'night');
    // warning is not part of a reading palette → must come from the app.
    expect(resolved.warning).toBe('#APP_WARNING');
    expect(resolved.background).toBe(READER_THEMES.night!.background);
  });

  it('does not mutate the input app colors', () => {
    const snapshot = {...appColors};
    resolveReaderTheme(appColors, 'sepia');
    expect(appColors).toEqual(snapshot);
  });
});

// T6.3b — Sepia joins PREMIUM_READER_THEMES but with a grandfathering
// exception (see ReaderPreferencesContext for how `sepiaGrandfathered` is
// derived at hydration).
describe('PREMIUM_READER_THEMES (T6.3b — sepia gated + grandfathered)', () => {
  it('includes sepia alongside the T6.3 exclusives', () => {
    expect(PREMIUM_READER_THEMES).toContain('sepia');
    expect(PREMIUM_READER_THEMES).toContain('musgo');
    expect(PREMIUM_READER_THEMES).toContain('crepusculo');
    expect(PREMIUM_READER_THEMES).toContain('niebla');
  });

  it('does not gate the other 4 original free surfaces', () => {
    expect(PREMIUM_READER_THEMES).not.toContain('system');
    expect(PREMIUM_READER_THEMES).not.toContain('paper');
    expect(PREMIUM_READER_THEMES).not.toContain('night');
    expect(PREMIUM_READER_THEMES).not.toContain('high-contrast');
  });
});

describe('isReaderThemeUnlocked', () => {
  it('unlocks every non-premium theme regardless of premium/grandfathering', () => {
    (['system', 'paper', 'night', 'high-contrast'] as ReaderTheme[]).forEach(
      theme => {
        expect(isReaderThemeUnlocked(theme, false, false)).toBe(true);
        expect(isReaderThemeUnlocked(theme, true, false)).toBe(true);
      },
    );
  });

  it('locks sepia for a non-premium, non-grandfathered device', () => {
    expect(isReaderThemeUnlocked('sepia', false, false)).toBe(false);
  });

  it('unlocks sepia for a grandfathered device even without premium', () => {
    expect(isReaderThemeUnlocked('sepia', false, true)).toBe(true);
  });

  it('unlocks sepia for a premium device regardless of grandfathering', () => {
    expect(isReaderThemeUnlocked('sepia', true, false)).toBe(true);
    expect(isReaderThemeUnlocked('sepia', true, true)).toBe(true);
  });

  it('locks the T6.3 exclusives for a non-premium device even when "sepiaGrandfathered" is true (grandfathering only ever applies to sepia)', () => {
    expect(isReaderThemeUnlocked('musgo', false, true)).toBe(false);
    expect(isReaderThemeUnlocked('crepusculo', false, true)).toBe(false);
    expect(isReaderThemeUnlocked('niebla', false, true)).toBe(false);
  });

  it('unlocks the T6.3 exclusives for a premium device', () => {
    expect(isReaderThemeUnlocked('musgo', true, false)).toBe(true);
    expect(isReaderThemeUnlocked('crepusculo', true, false)).toBe(true);
    expect(isReaderThemeUnlocked('niebla', true, false)).toBe(true);
  });
});
