/**
 * 🧠 MEMORY DECK CONTEXT
 *
 * Owns the user's verse-memorization deck. Stores each card as a value
 * in a `Record<verseKey, MemoryCard>` blob in AsyncStorage under
 * `@memory_deck`; the verseKey ("Book/Chapter/Verse") doubles as the
 * dedupe key, so adding the same verse twice is a no-op.
 *
 * The pure SRS math lives in `src/lib/memory/srs.ts` — this context
 * only handles persistence + React glue.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyReview,
  buildVerseKey,
  createCard,
  isMastered,
  MemoryCard,
  ReviewGrade,
  selectDueCards,
} from '../lib/memory/srs';

const STORAGE_KEY = '@memory_deck';

interface AddCardInput {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

export interface MemoryDeckStats {
  total: number;
  due: number;
  mastered: number;
}

interface MemoryDeckContextValue {
  /** All cards in the deck. Stable insertion order isn't guaranteed. */
  cards: MemoryCard[];
  /** True until AsyncStorage hydration completes once. */
  hydrated: boolean;
  /** Cards whose dueAt has passed (according to a captured "now"). */
  dueCards: MemoryCard[];
  /** Aggregate counters surfaced on Home / deck screen. */
  stats: MemoryDeckStats;
  /** True if the verse is already in the deck. */
  hasCard: (verseKey: string) => boolean;
  /** Add a verse — no-op if already present. */
  addCard: (input: AddCardInput) => void;
  /** Remove a verse from the deck. */
  removeCard: (verseKey: string) => void;
  /** Apply a review grade to a card; reschedules it via the SRS algo. */
  reviewCard: (verseKey: string, grade: ReviewGrade) => void;
  /** Forget every card (handy for "Reset" affordance). */
  resetDeck: () => void;
}

const MemoryDeckContext = createContext<MemoryDeckContextValue | undefined>(
  undefined,
);

interface MemoryDeckProviderProps {
  children: ReactNode;
}

export const MemoryDeckProvider: React.FC<MemoryDeckProviderProps> = ({
  children,
}) => {
  const [deck, setDeck] = useState<Record<string, MemoryCard>>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Record<string, MemoryCard>;
            // Drop anything that doesn't look like a card so a corrupt
            // blob can't crash the screen.
            const clean: Record<string, MemoryCard> = {};
            for (const [k, v] of Object.entries(parsed)) {
              if (
                v &&
                typeof v.verseKey === 'string' &&
                typeof v.box === 'number'
              ) {
                clean[k] = v;
              }
            }
            setDeck(clean);
          } catch {
            // fall through to empty deck
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // Persist on every change post-hydration.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deck)).catch(
      () => undefined,
    );
  }, [deck, hydrated]);

  const addCard = useCallback((input: AddCardInput) => {
    const key = buildVerseKey(input.bookName, input.chapter, input.verse);
    setDeck(prev => {
      if (prev[key]) return prev; // already in deck — no-op
      const now = new Date().toISOString();
      return {
        ...prev,
        [key]: createCard({
          verseKey: key,
          bookName: input.bookName,
          chapter: input.chapter,
          verse: input.verse,
          text: input.text,
          version: input.version,
          now,
        }),
      };
    });
  }, []);

  const removeCard = useCallback((verseKey: string) => {
    setDeck(prev => {
      if (!prev[verseKey]) return prev;
      const {[verseKey]: _drop, ...rest} = prev;
      void _drop;
      return rest;
    });
  }, []);

  const reviewCard = useCallback((verseKey: string, grade: ReviewGrade) => {
    setDeck(prev => {
      const existing = prev[verseKey];
      if (!existing) return prev;
      return {
        ...prev,
        [verseKey]: applyReview(existing, grade, new Date()),
      };
    });
  }, []);

  const resetDeck = useCallback(() => {
    setDeck({});
  }, []);

  const cards = useMemo(() => Object.values(deck), [deck]);

  const dueCards = useMemo(() => selectDueCards(cards, new Date()), [cards]);

  const stats = useMemo<MemoryDeckStats>(
    () => ({
      total: cards.length,
      due: dueCards.length,
      mastered: cards.filter(isMastered).length,
    }),
    [cards, dueCards.length],
  );

  const hasCard = useCallback(
    (verseKey: string) => Boolean(deck[verseKey]),
    [deck],
  );

  const value = useMemo<MemoryDeckContextValue>(
    () => ({
      cards,
      hydrated,
      dueCards,
      stats,
      hasCard,
      addCard,
      removeCard,
      reviewCard,
      resetDeck,
    }),
    [
      cards,
      hydrated,
      dueCards,
      stats,
      hasCard,
      addCard,
      removeCard,
      reviewCard,
      resetDeck,
    ],
  );

  return (
    <MemoryDeckContext.Provider value={value}>
      {children}
    </MemoryDeckContext.Provider>
  );
};

export function useMemoryDeck(): MemoryDeckContextValue {
  const ctx = useContext(MemoryDeckContext);
  if (!ctx) {
    throw new Error('useMemoryDeck must be used within a MemoryDeckProvider');
  }
  return ctx;
}
