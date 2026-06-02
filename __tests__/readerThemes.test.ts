/**
 * Sprint 54 — reader reading themes (pure module).
 */

import {
  READER_THEMES,
  READER_THEME_ORDER,
  LEGACY_AUDIO_HIGHLIGHT,
  LEGACY_ON_HIGHLIGHT,
  isReaderTheme,
  resolveReaderTheme,
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

  it.each(['paper', 'sepia', 'night', 'high-contrast'] as ReaderTheme[])(
    '%s palette defines every reading-surface key',
    theme => {
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
    },
  );
});

describe('isReaderTheme', () => {
  it('accepts the four known themes', () => {
    expect(isReaderTheme('system')).toBe(true);
    expect(isReaderTheme('paper')).toBe(true);
    expect(isReaderTheme('sepia')).toBe(true);
    expect(isReaderTheme('night')).toBe(true);
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
