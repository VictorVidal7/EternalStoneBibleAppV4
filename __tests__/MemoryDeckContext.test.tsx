/**
 * Sprint 48 — MemoryDeckContext integration: the calibrated ease prior.
 *
 * Verifies the runtime wiring (not just the pure math): the provider reads
 * the review-event log on mount, computes the population ease prior, caches
 * it, and seeds a newly-added card with that ease. We mock the SQLite-backed
 * review-event store so the log is deterministic; everything else (the pure
 * `computeEasePrior`, `createCard`, AsyncStorage) runs for real.
 */

import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';
import {
  EASE_PRIOR_SENSITIVITY,
  TARGET_RETENTION,
} from '../src/lib/memory/easePrior';

// Control the review log the prior is calibrated from. `mock`-prefixed so the
// jest.mock factory can close over it (babel-plugin-jest-hoist requirement).
const mockGetAllReviewEvents = jest.fn<Promise<ReviewEvent[]>, []>();
jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: () => mockGetAllReviewEvents(),
  addReviewEvent: jest.fn().mockResolvedValue(undefined),
  getReviewEventById: jest.fn().mockResolvedValue(null),
  removeReviewEvent: jest.fn().mockResolvedValue(undefined),
}));

import {
  MemoryDeckProvider,
  useMemoryDeck,
  type MemoryDeckContextValue,
} from '../src/context/MemoryDeckContext';
import {
  emitBackupRestored,
  __resetBackupRestoredListenersForTests,
} from '../src/lib/backup/restoreSignal';
import {DEFAULT_EASE as SRS_DEFAULT_EASE} from '../src/lib/memory/srs';

/** `count` interval-bearing review events, all recalled (retention = 1.0). */
function recalledEvents(count: number): ReviewEvent[] {
  const now = Date.now();
  return Array.from({length: count}, (_, k) => ({
    id: `John/3/16__${now - k * 1000}`,
    verseKey: 'John/3/16',
    bookName: 'John',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 3,
    reviewedAt: now - k * 1000,
  }));
}

let captured: MemoryDeckContextValue | null = null;
function Capture() {
  captured = useMemoryDeck();
  return <Text>{captured.cards.length}</Text>;
}

/** Mount the provider and wait until hydration + the async prior load settle. */
async function mountAndSettle() {
  render(
    <MemoryDeckProvider>
      <Capture />
    </MemoryDeckProvider>,
  );
  await waitFor(() => expect(captured?.hydrated).toBe(true));
  // Flush the async refreshEasePrior (getAllReviewEvents → summary → prior).
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('MemoryDeckContext — calibrated ease prior', () => {
  beforeEach(async () => {
    captured = null;
    mockGetAllReviewEvents.mockReset();
    // The AsyncStorage mock persists across tests — clear the deck blob so a
    // card added by one test doesn't rehydrate (and dedupe) into the next.
    await AsyncStorage.clear();
  });

  // Unmount the previous provider so its Capture can't clobber `captured`
  // (auto-cleanup isn't guaranteed under this jest-expo setup).
  afterEach(() => {
    cleanup();
  });

  it('seeds a newly added card with the calibrated population prior', async () => {
    // 40 interval-bearing reviews, all recalled → retention 1.0 → ease up.
    mockGetAllReviewEvents.mockResolvedValue(recalledEvents(40));
    await mountAndSettle();

    await act(async () => {
      captured!.addCard({
        bookName: 'Psalms',
        chapter: 23,
        verse: 1,
        text: 'The LORD is my shepherd…',
        version: 'KJV',
      });
    });
    await waitFor(() => expect(captured!.cards.length).toBe(1));

    const expected =
      SRS_DEFAULT_EASE + EASE_PRIOR_SENSITIVITY * (1 - TARGET_RETENTION);
    expect(captured!.cards[0].ease).toBeCloseTo(expected, 5);
    expect(captured!.cards[0].ease).toBeGreaterThan(SRS_DEFAULT_EASE);
  });

  it('falls back to the default ease when the log is too sparse', async () => {
    // Below MIN_CALIBRATION_REVIEWS → uncalibrated → plain Leitner.
    mockGetAllReviewEvents.mockResolvedValue(recalledEvents(5));
    await mountAndSettle();

    await act(async () => {
      captured!.addCard({
        bookName: 'Psalms',
        chapter: 23,
        verse: 1,
        text: 'The LORD is my shepherd…',
        version: 'KJV',
      });
    });
    await waitFor(() => expect(captured!.cards.length).toBe(1));

    expect(captured!.cards[0].ease).toBe(SRS_DEFAULT_EASE);
  });
});

describe('R9-28 — un respaldo importado no puede ser pisado por la copia en memoria', () => {
  /** Una tarjeta tal y como queda en `@memory_deck`: mapa por verseKey. */
  function storedDeck(verseKey: string, bookName: string, chapter: number) {
    return {
      [verseKey]: {
        verseKey,
        bookName,
        chapter,
        verse: 1,
        text: 'texto',
        version: 'KJV',
        box: 1,
        dueAt: '2026-01-01T00:00:00.000Z',
        addedAt: '2026-01-01T00:00:00.000Z',
        lastReviewedAt: null,
        reviewCount: 0,
        lapseCount: 0,
        updatedAt: 1,
      },
    };
  }

  beforeEach(async () => {
    captured = null;
    mockGetAllReviewEvents.mockReset();
    mockGetAllReviewEvents.mockResolvedValue([]);
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Monta con el mazo PRE-import —el que el provider lee al montarse y lleva en
   * `useState` desde entonces— y despues hace lo que hace `importBackup`:
   * escribe `@memory_deck` DIRECTAMENTE, por detras del provider, y avisa una
   * vez que termino con los dos motores.
   */
  async function montarYRestaurar(): Promise<void> {
    await AsyncStorage.setItem(
      '@memory_deck',
      JSON.stringify(storedDeck('Psalms/23/1', 'Psalms', 23)),
    );
    await mountAndSettle();
    expect(captured!.cards.map(c => c.verseKey)).toEqual(['Psalms/23/1']);

    await AsyncStorage.setItem(
      '@memory_deck',
      JSON.stringify(storedDeck('John/3/16', 'John', 3)),
    );
    await act(async () => {
      emitBackupRestored();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }

  it('re-hidrata al aviso en vez de seguir con el mazo pre-import', async () => {
    await montarYRestaurar();
    expect(captured!.cards.map(c => c.verseKey)).toEqual(['John/3/16']);
  });

  it('y por eso la siguiente interaccion ya no pisa lo restaurado', async () => {
    // Va en una prueba APARTE a proposito: si comparte cuerpo con la de arriba,
    // el revert la tumba en la primera asercion y esta —la que reproduce la
    // PERDIDA DE DATOS, no la pantalla obsoleta— nunca llega a evaluarse, asi
    // que no probaria nada por si sola.
    await montarYRestaurar();

    // Sin re-hidratar, el efecto de persistir re-serializa el mazo viejo encima
    // de lo restaurado a la primera interaccion. Sin toast, sin error y sin
    // log, justo despues de decirle al usuario «Copia de seguridad importada
    // correctamente».
    await act(async () => {
      captured!.addCard({
        bookName: 'Mark',
        chapter: 1,
        verse: 1,
        text: 'El principio del evangelio',
        version: 'KJV',
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const raw = await AsyncStorage.getItem('@memory_deck');
    expect(Object.keys(JSON.parse(raw!)).sort()).toEqual([
      'John/3/16',
      'Mark/1/1',
    ]);
  });
});
