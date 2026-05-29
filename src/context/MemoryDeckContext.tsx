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
  useRef,
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
import {getSyncEngine, type SyncAdapter, type SyncEntity} from '../lib/sync';
import {
  buildReviewEvent,
  reviewEventToRemote,
} from '../lib/memory/reviewEvents';
import {addReviewEvent} from '../lib/memory/reviewEventStore';
import {useSyncEngineOptional} from './SyncEngineContext';

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

function cardToRemote(c: MemoryCard): SyncEntity<MemoryCard> {
  return {...c};
}

export const MemoryDeckProvider: React.FC<MemoryDeckProviderProps> = ({
  children,
}) => {
  const [deck, setDeck] = useState<Record<string, MemoryCard>>({});
  const [hydrated, setHydrated] = useState(false);
  const syncCtx = useSyncEngineOptional();
  // Sprint 45 — see FavoritesContext: depend on the stable engine ref,
  // not the context value, so the adapter registers once instead of
  // re-subscribing on every engine state tick.
  const syncEngine = syncCtx?.engine ?? null;

  const deckRef = useRef<Record<string, MemoryCard>>({});
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

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
                // Sprint 42 backfill: cards persisted before this
                // sprint lack `updatedAt`. Default to addedAt (which
                // every existing card has) or Date.now().
                const updatedAt =
                  typeof v.updatedAt === 'number'
                    ? v.updatedAt
                    : v.addedAt
                      ? Date.parse(v.addedAt) || Date.now()
                      : Date.now();
                clean[k] = {...v, updatedAt};
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

  // Sync adapter — memoria cards use verseKey as their id (stable
  // across devices because it's derived from the verse identity, not a
  // generated timestamp).
  useEffect(() => {
    if (!syncEngine) return;
    const adapter: SyncAdapter<MemoryCard> = {
      collection: 'memoryCards',
      async getLocal(id) {
        const c = deckRef.current[id];
        return c ? cardToRemote(c) : null;
      },
      async applyRemoteUpsert(id, data) {
        const incoming: MemoryCard = {
          verseKey: data.verseKey || id,
          bookName: data.bookName,
          chapter: data.chapter,
          verse: data.verse,
          text: data.text,
          version: data.version,
          box: data.box,
          dueAt: data.dueAt,
          addedAt: data.addedAt,
          lastReviewedAt: data.lastReviewedAt ?? null,
          reviewCount: data.reviewCount ?? 0,
          updatedAt:
            typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
        setDeck(prev => ({...prev, [id]: incoming}));
      },
      async applyRemoteDelete(id) {
        setDeck(prev => {
          if (!prev[id]) return prev;
          const {[id]: _drop, ...rest} = prev;
          void _drop;
          return rest;
        });
      },
      async pullAllLocal() {
        return Object.values(deckRef.current).map(c => ({
          id: c.verseKey,
          data: cardToRemote(c),
        }));
      },
      // Sprint 43 — SRS reviews aren't user-facing "conflicts": if two
      // devices review the same card in <30s, both decisions are valid
      // and LWW (most recent review wins) is the right semantic. Opt out
      // by returning an empty array — the engine reverts to plain LWW.
      getMaterialFields() {
        return [] as const;
      },
    };
    syncEngine.register(adapter);
    return () => {
      syncEngine.unregister('memoryCards');
    };
  }, [syncEngine]);

  const addCard = useCallback((input: AddCardInput) => {
    const key = buildVerseKey(input.bookName, input.chapter, input.verse);
    if (deckRef.current[key]) return; // already in deck — no-op
    const now = new Date().toISOString();
    const card = createCard({
      verseKey: key,
      bookName: input.bookName,
      chapter: input.chapter,
      verse: input.verse,
      text: input.text,
      version: input.version,
      now,
    });
    setDeck(prev => (prev[key] ? prev : {...prev, [key]: card}));
    getSyncEngine()?.queueWrite('memoryCards', key, cardToRemote(card));
  }, []);

  const removeCard = useCallback((verseKey: string) => {
    const existing = deckRef.current[verseKey];
    if (!existing) return;
    setDeck(prev => {
      if (!prev[verseKey]) return prev;
      const {[verseKey]: _drop, ...rest} = prev;
      void _drop;
      return rest;
    });
    getSyncEngine()?.queueDelete(
      'memoryCards',
      verseKey,
      cardToRemote(existing),
    );
  }, []);

  const reviewCard = useCallback((verseKey: string, grade: ReviewGrade) => {
    const existing = deckRef.current[verseKey];
    if (!existing) return;
    const now = new Date();
    const updated = applyReview(existing, grade, now);
    setDeck(prev => (prev[verseKey] ? {...prev, [verseKey]: updated} : prev));
    const engine = getSyncEngine();
    engine?.queueWrite('memoryCards', verseKey, cardToRemote(updated));
    // Sprint 45 — append an immutable review event to the SQLite log and
    // queue it as the 6th synced dataset. Fire-and-forget: the local card
    // state above is the source of truth for the deck; the event log is a
    // separate append-only history feeding the insights heatmap/retention.
    const event = buildReviewEvent({
      cardBefore: existing,
      cardAfter: updated,
      grade,
      now,
    });
    void addReviewEvent(event);
    engine?.queueWrite('reviewEvents', event.id, reviewEventToRemote(event));
  }, []);

  const resetDeck = useCallback(() => {
    const snapshot = Object.values(deckRef.current);
    setDeck({});
    const engine = getSyncEngine();
    if (engine) {
      for (const card of snapshot) {
        engine.queueDelete('memoryCards', card.verseKey, cardToRemote(card));
      }
    }
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
