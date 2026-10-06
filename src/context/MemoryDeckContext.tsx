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
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyReview,
  buildVerseKey,
  createCard,
  DEFAULT_EASE,
  isMastered,
  MemoryCard,
  normalizeEase,
  ReviewGrade,
  selectDueCards,
} from '../lib/memory/srs';
import {
  getSyncEngine,
  nullifyUndefined,
  type SyncAdapter,
  type SyncEntity,
} from '../lib/sync';
import {buildReviewEvent} from '../lib/memory/reviewEvents';
import {
  addReviewEvent,
  getAllReviewEvents,
} from '../lib/memory/reviewEventStore';
import {historySummary} from '../lib/memory/history';
import {computeEasePrior} from '../lib/memory/easePrior';
import {maybeWriteMemoryStatsSummary} from '../lib/memory/memoryStatsSync';
import {subscribeBackupRestored} from '../lib/backup/restoreSignal';
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

export interface MemoryDeckContextValue {
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

// Sprint 78 — every MemoryCard field is required (lastReviewedAt is null,
// never undefined), but per the S77 lesson every *ToRemote builder
// sanitizes by construction: one optional field emitting `undefined` would
// silently block the card from ever syncing.
function cardToRemote(c: MemoryCard): SyncEntity<MemoryCard> {
  return nullifyUndefined({...c});
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

  // R9-133 — the deck as of the last write: every write sets it before React
  // renders, and the adapter reads it. It used to follow `deck` after the
  // render, so a remote copy that came in between was judged against the card
  // before the review, and replaced it.
  const deckRef = useRef<Record<string, MemoryCard>>({});
  // R9-277 — the edits made since a load began, until the last load in flight
  // reads the disk: each read lays them over what it reads. The load used to
  // replace the deck, and a card added while it was in flight was gone from
  // the screen and the disk.
  const unsaved = useRef<Map<string, MemoryCard | null> | null>(null);
  const edit = useCallback((changes: Record<string, MemoryCard | null>) => {
    const next = {...deckRef.current};
    for (const [k, v] of Object.entries(changes)) {
      if (v) next[k] = v;
      else delete next[k];
      unsaved.current?.set(k, v);
    }
    deckRef.current = next;
    setDeck(next);
  }, []);

  // Sprint 48 — calibrated ease prior for NEW cards. Derived from the synced
  // review-event log (so it's the same on every device, no new dataset), it
  // seeds a new card's starting ease from the user's measured retention
  // instead of the neutral default. Cached in a ref because `addCard` is
  // synchronous; refreshed on mount and after every review so it tracks the
  // latest history. Falls back to DEFAULT_EASE while the log is too sparse.
  const easePriorRef = useRef<number>(DEFAULT_EASE);
  const refreshEasePrior = useCallback(async () => {
    try {
      const events = await getAllReviewEvents();
      const summary = historySummary(events, new Date());
      easePriorRef.current = computeEasePrior(summary).ease;
    } catch {
      // Keep the last known prior (or the default) if the log read fails.
    }
  }, []);
  useEffect(() => {
    void refreshEasePrior();
  }, [refreshEasePrior]);

  // R9-264 — the last load of the deck, and whether it read the disk:
  // `pullAllLocal` waits for it.
  const deckLoad = useRef<Promise<boolean> | null>(null);
  const loadSeq = useRef(0);

  // Read the deck off disk and adopt it. Extracted from the mount effect so
  // the backup-restore signal can re-run exactly the same parse (R9-28).
  const hydrateFromStorage = useCallback(async () => {
    const seq = ++loadSeq.current;
    unsaved.current ??= new Map();
    const load = AsyncStorage.getItem(STORAGE_KEY).then(
      raw => {
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
                // Sprint 46 backfill: cards persisted before the adaptive
                // scheduler lack `ease` — seed it to the neutral default so
                // they behave like plain Leitner until reviewed again.
                // lapseCount backfill: cards persisted before the local-first
                // quota feature lack it — default 0.
                clean[k] = {
                  ...v,
                  ease: normalizeEase(v.ease),
                  lapseCount:
                    typeof v.lapseCount === 'number' ? v.lapseCount : 0,
                  updatedAt,
                };
              }
            }
            for (const [k, v] of unsaved.current ?? []) {
              if (v) clean[k] = v;
              else delete clean[k];
            }
            // R9-264 — with the state, so a caller that waited for this load
            // reads it now.
            deckRef.current = clean;
            setDeck(clean);
          } catch {
            // fall through to empty deck
          }
        }
        // A value that is not JSON reads the same every time, and the deck
        // written next replaces it: read, as an empty deck. Without a deck on
        // disk, memory already holds the edits.
        // R9-277 — a newer load (the backup's) reads what came after this one.
        if (seq === loadSeq.current) unsaved.current = null;
        return true;
      },
      () => false,
    );
    deckLoad.current = load;
    await load.finally(() => setHydrated(true));
  }, []);

  // Hydrate from storage once.
  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  // R9-28 — an import writes `@memory_deck` directly, behind this provider's
  // back. Without this, the effect below would re-serialize the PRE-import
  // deck on the very next review and the restored one would vanish silently.
  useEffect(
    () => subscribeBackupRestored(() => void hydrateFromStorage()),
    [hydrateFromStorage],
  );

  // Persist on every change post-hydration.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deck)).catch(
      () => undefined,
    );
  }, [deck, hydrated]);

  // Local-first quota feature — push the memoryStats aggregate on app
  // background (NOT per review), at most once per unchanged snapshot. This is
  // the cheap cross-device substitute for the per-review reviewEvents write we
  // dropped. No-ops when signed out / offline (guarded inside the writer).
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'background') return;
      void maybeWriteMemoryStatsSummary();
    });
    return () => sub.remove();
  }, []);

  // Sync adapter — memoria cards use verseKey as their id (stable
  // across devices because it's derived from the verse identity, not a
  // generated timestamp).
  useEffect(() => {
    if (!syncEngine) return;
    const adapter: SyncAdapter<MemoryCard> = {
      collection: 'memoryCards',
      // R9-133 — after the load too: until it ends the ref is empty, and
      // "absent" let any remote copy in without LWW (an older one replaced
      // the card). A load that could not read the disk throws: the engine
      // skips the doc and holds its cursor back (R9-46).
      async getLocal(id) {
        if (!(await deckLoad.current)) {
          throw new Error('memory deck: the load did not read the disk');
        }
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
          // Remote cards from a device that predates lapseCount won't carry it.
          lapseCount: data.lapseCount ?? 0,
          // Sprint 46 — remote cards from before the adaptive scheduler
          // (or from a device that hasn't upgraded) won't carry `ease`.
          ease: normalizeEase(data.ease),
          updatedAt:
            typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
        edit({[id]: incoming});
      },
      async applyRemoteDelete(id) {
        if (deckRef.current[id]) edit({[id]: null});
      },
      // R9-264 — after the load, as R9-214 does with SQLite: until it ends
      // the ref is empty, and the first bulk push of a cold start queued
      // nothing and still marked the account as pushed. A load that could not
      // read the disk throws: both callers log it, and the bulk push tries
      // this collection again on the next start (R9-257).
      async pullAllLocal() {
        if (!(await deckLoad.current)) {
          throw new Error('memory deck: the load did not read the disk');
        }
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
  }, [syncEngine, edit]);

  const addCard = useCallback(
    (input: AddCardInput) => {
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
        // Sprint 48 — seed the new card with the calibrated population ease
        // prior (DEFAULT_EASE until there's enough history to calibrate).
        ease: easePriorRef.current,
      });
      edit({[key]: card});
      getSyncEngine()?.queueWrite('memoryCards', key, cardToRemote(card));
    },
    [edit],
  );

  const removeCard = useCallback(
    (verseKey: string) => {
      const existing = deckRef.current[verseKey];
      if (!existing) return;
      edit({[verseKey]: null});
      getSyncEngine()?.queueDelete(
        'memoryCards',
        verseKey,
        cardToRemote(existing),
      );
    },
    [edit],
  );

  const reviewCard = useCallback(
    (verseKey: string, grade: ReviewGrade) => {
      const existing = deckRef.current[verseKey];
      if (!existing) return;
      const now = new Date();
      const updated = applyReview(existing, grade, now);
      edit({[verseKey]: updated});
      const engine = getSyncEngine();
      engine?.queueWrite('memoryCards', verseKey, cardToRemote(updated));
      // Local-first quota feature — append the immutable review event to the
      // local SQLite log ONLY. It is NO LONGER queued to Firestore per review
      // (that per-review reviewEvents write roughly halved the free-tier
      // ceiling). Cross-device continuity for streak/heatmap/retention now
      // rides the bounded `memoryStats/summary` aggregate instead
      // (memoryStatsSync). The card write above still carries lapseCount, so
      // leech detection survives a reinstall via the synced deck.
      const event = buildReviewEvent({
        cardBefore: existing,
        cardAfter: updated,
        grade,
        now,
      });
      void addReviewEvent(event);
      // Sprint 48 — a new review changes the retention history the ease prior
      // is calibrated from; recompute so the next added card uses fresh data.
      void refreshEasePrior();
    },
    [refreshEasePrior, edit],
  );

  const resetDeck = useCallback(() => {
    const snapshot = Object.values(deckRef.current);
    edit(Object.fromEntries(snapshot.map(c => [c.verseKey, null])));
    const engine = getSyncEngine();
    if (engine) {
      for (const card of snapshot) {
        engine.queueDelete('memoryCards', card.verseKey, cardToRemote(card));
      }
    }
  }, [edit]);

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
