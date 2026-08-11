/**
 * Memory deck screen (`memory/index.tsx`) — two additions:
 *
 * 1. "Agregar tarjeta nueva sin salir de Memorizar": a "+" header button
 *    (and, in the empty state, a matching CTA) that opens a book → chapter
 *    → verse picker and adds the chosen verses via MemoryDeckContext's
 *    `addCard`, without leaving the memorize screen. The picker itself
 *    lives in `src/features/memory/MemoryVersePickerSheet.tsx`.
 * 2. "Favoritar desde Memorizar": each deck row (`DeckRow`) gets a heart
 *    toggle that adds/removes that verse from Favoritos, mirroring the
 *    reader's own heart-icon toggle and the EXISTING (untouched) reverse
 *    direction in favorites.tsx (the school-icon toggle there).
 *
 * `MemoryDeckScreen` itself can't be fully mounted under react-test-renderer
 * here: its header unconditionally renders `StatBubble`/`PulsingPracticeCta`,
 * which call `Animated.spring(..., {useNativeDriver: true})` on mount and
 * throw "Unable to locate attached view in the native tree" (no native view
 * for the driver to attach to) — a PRE-EXISTING limitation of this specific
 * screen's animations under the test renderer, unrelated to this change (no
 * prior test in this repo fully renders this screen either). So this file:
 *
 *  - Renders `DeckRow` DIRECTLY (exported for exactly this reason) to cover
 *    the new favorite toggle with a real render + real presses.
 *  - Unit-tests the exported pure `describeAddVersesOutcome` helper, which
 *    is what decides which of the three "added" toasts to show.
 *  - Source-scans `index.tsx` for the header "+"/empty-state CTA/picker
 *    wiring, the same proxy pattern `readerFavoriteHeartA11y.test.ts` uses
 *    for a screen that can't be fully rendered.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {DeckRow, describeAddVersesOutcome} from '../app/features/memory/index';
import {translations} from '../src/i18n/translations';
import {createCard} from '../src/lib/memory/srs';

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

const t = translations.es;
const v = translations.es.verse;

const card = createCard({
  verseKey: 'Juan/3/16',
  bookName: 'Juan',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo',
  version: 'RVR1960',
  now: new Date().toISOString(),
});

const colors = {
  surface: '#111111',
  border: '#222222',
  primary: '#6366f1',
  success: '#22c55e',
  error: '#ef4444',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('describeAddVersesOutcome — which "added" toast to show', () => {
  it('reports "none" when every picked verse was already in the deck (no false "added" toast)', () => {
    expect(describeAddVersesOutcome(0)).toEqual({kind: 'none'});
  });

  it('reports "one" for a single newly-added verse (singular toast copy)', () => {
    expect(describeAddVersesOutcome(1)).toEqual({kind: 'one'});
  });

  it('reports "many" with the exact new count for a multi-verse pick', () => {
    expect(describeAddVersesOutcome(3)).toEqual({kind: 'many', count: 3});
  });
});

describe('DeckRow — favorite toggle', () => {
  it('offers "add to favorites" when the card is not yet favorited', () => {
    const {getByLabelText} = render(
      <DeckRow
        card={card}
        language="es"
        t={t}
        colors={colors}
        isFavorited={false}
        onRemove={jest.fn()}
        onToggleFavorite={jest.fn()}
      />,
    );
    expect(getByLabelText(v.addFavorite)).toBeTruthy();
  });

  it('offers "remove from favorites" when the card IS already favorited', () => {
    const {getByLabelText} = render(
      <DeckRow
        card={card}
        language="es"
        t={t}
        colors={colors}
        isFavorited
        onRemove={jest.fn()}
        onToggleFavorite={jest.fn()}
      />,
    );
    expect(getByLabelText(v.removeFavorite)).toBeTruthy();
  });

  it('calls onToggleFavorite (not onRemove) when the heart is pressed', () => {
    const onToggleFavorite = jest.fn();
    const onRemove = jest.fn();
    const {getByLabelText} = render(
      <DeckRow
        card={card}
        language="es"
        t={t}
        colors={colors}
        isFavorited={false}
        onRemove={onRemove}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    fireEvent.press(getByLabelText(v.addFavorite));

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('still calls onRemove (untouched) when the trash icon is pressed', () => {
    const onRemove = jest.fn();
    const {getByLabelText} = render(
      <DeckRow
        card={card}
        language="es"
        t={t}
        colors={colors}
        isFavorited={false}
        onRemove={onRemove}
        onToggleFavorite={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText(t.memory.removeFromDeck));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe('memory/index.tsx source wiring — add-verse affordances', () => {
  const raw = fs.readFileSync(
    path.join(__dirname, '..', 'app/features/memory/index.tsx'),
    'utf8',
  );

  it('wires the header "+" button to t.memory.addVerse and opens the picker', () => {
    const headerBlock = raw.slice(
      raw.indexOf('Agregar tarjeta nueva sin salir de Memorizar — opens'),
      raw.indexOf('Agregar tarjeta nueva sin salir de Memorizar — opens') + 500,
    );
    expect(headerBlock).toMatch(/setPickerVisible\(true\)/);
    expect(headerBlock).toMatch(/accessibilityLabel=\{t\.memory\.addVerse\}/);
  });

  it('wires the empty-state CTA to t.memory.addVerse and opens the picker too', () => {
    const emptyBlock = raw.slice(
      raw.indexOf('styles.emptyAddButton'),
      raw.indexOf('styles.emptyAddButton') + 400,
    );
    expect(emptyBlock).toMatch(/setPickerVisible\(true\)/);
    expect(emptyBlock).toMatch(/t\.memory\.addVerse/);
  });

  it('mounts MemoryVersePickerSheet wired to handleAddVerses', () => {
    expect(raw).toMatch(/<MemoryVersePickerSheet/);
    expect(raw).toMatch(/onAddVerses=\{handleAddVerses\}/);
  });

  it("canonicalizes the picked verse's book name before checking/adding, matching favorites.tsx's key convention", () => {
    // The picker hands back the ACTIVE reading version's raw book name
    // (e.g. "Juan" under RVR1960), but favorites.tsx's toggleMemory already
    // stores memory-deck cards keyed by the CANONICAL English name (via
    // FavoritesContext's own canonicalization). Without canonicalizing
    // here too, adding "Juan 3:16" from this picker while it's already in
    // the deck as "John 3:16" (added via the favorites toggle) would build
    // a different verseKey and silently duplicate the card.
    const handleAddVersesBlock = raw.slice(
      raw.indexOf('const handleAddVerses'),
      raw.indexOf('const handleAddVerses') + 1200,
    );
    expect(handleAddVersesBlock).toMatch(
      /hasCard\(\s*buildVerseKey\(canonicalBookName\(v\.book\)/,
    );
    expect(handleAddVersesBlock).toMatch(
      /bookName:\s*canonicalBookName\(v\.book\)/,
    );
  });

  it('every referenced i18n key exists for every supported language', () => {
    for (const lang of Object.keys(translations) as Array<
      keyof typeof translations
    >) {
      const tr = translations[lang];
      expect(typeof tr.memory.addVerse).toBe('string');
      expect(typeof tr.memory.addedToast).toBe('string');
      expect(typeof tr.memory.addedToastMany).toBe('string');
      expect(typeof tr.memory.alreadyInDeck).toBe('string');
      expect(typeof tr.verse.addFavorite).toBe('string');
      expect(typeof tr.verse.removeFavorite).toBe('string');
    }
  });
});
