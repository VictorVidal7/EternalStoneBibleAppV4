/**
 * MemoryDeckContext.web — inert web stub (stopgap crash fix, extended tanda).
 *
 * See PremiumContext.web.tsx's header comment for the general crash story.
 * This fixes the fourth+ hook group found still-crashing after that first
 * pass: `app/features/quiz/index.tsx`, `app/features/lectio.tsx`,
 * `app/features/memory/insights.tsx` and `app/(tabs)/favorites.tsx` all call
 * `useMemoryDeck()` unconditionally, with no MemoryDeckProvider mounted on
 * web and no `.web.tsx` variant of their own.
 *
 * Unlike Premium/OfferingSheet/AudioPlayer, MemoryDeckContext has NO
 * native-only dependency — its persistence is AsyncStorage (web-safe) plus
 * `bibleDB`'s `review_events` table (expo-sqlite already works on web, see
 * `verse/[book]/[chapter].web.tsx`), and every sync touchpoint
 * (`getSyncEngine()`, `useSyncEngineOptional()`) already degrades to a safe
 * no-op when — as on web — no SyncEngineProvider is ever mounted. So this is
 * a STUB BY PRODUCT-SCOPE CHOICE, not by technical necessity:
 *
 * Mounting the real provider would let a web visitor build an SRS
 * memorization deck (`addCard`/`reviewCard`) that lives ONLY in that
 * browser's AsyncStorage + OPFS SQLite. Web has no AuthProvider and no
 * SyncEngineProvider (v1 web is the read-only reader, Victor-confirmed T21
 * scope — see app/_layout.web.tsx's header comment), so that deck can NEVER
 * reach the user's phone/account and silently vanishes the moment they clear
 * site data or open the app in another browser. That's a real data-loss trap
 * dressed up as a working feature, not a harmless stub — so this file keeps
 * the deck permanently empty and every mutation a safe no-op instead.
 * (Contrast FavoritesContext, which mounts for real on web: no web-reachable
 * screen calls `addFavorite`, so there is no equivalent orphaned-data risk.)
 *
 * Metro resolves this file automatically in place of MemoryDeckContext.tsx
 * for any web bundle (see data-loader.web.ts for the established platform-
 * split precedent), so every existing `useMemoryDeck()` call site gets this
 * safe value with ZERO changes to route files. tsc always resolves a bare
 * `@context/MemoryDeckContext` import against the NATIVE file, so this
 * file's exported surface must keep matching it.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {createContext, useContext, ReactNode} from 'react';
import {logger} from '@lib/utils/logger';
import type {
  MemoryDeckContextValue,
  MemoryDeckStats,
} from './MemoryDeckContext';

const MemoryDeckContext = createContext<MemoryDeckContextValue | undefined>(
  undefined,
);

const STUB_STATS: MemoryDeckStats = {total: 0, due: 0, mastered: 0};

function hasCardNoop(): boolean {
  return false;
}

function logNoop(action: string): void {
  logger.info(
    `MemoryDeckContext.web: ${action} is a no-op (no memory deck on web)`,
    {component: 'MemoryDeckContext.web', action},
  );
}

function addCardNoop(): void {
  logNoop('addCard');
}
function removeCardNoop(): void {
  logNoop('removeCard');
}
function reviewCardNoop(): void {
  logNoop('reviewCard');
}
function resetDeckNoop(): void {
  logNoop('resetDeck');
}

// Static — nothing here ever changes at runtime (there is no deck on web),
// so a single stable value object avoids re-rendering every consumer.
const STUB_VALUE: MemoryDeckContextValue = {
  cards: [],
  // No AsyncStorage read is ever attempted, so there is nothing to wait on —
  // "hydrated" is true immediately, matching the real provider's post-load
  // steady state rather than an eternal loading flag.
  hydrated: true,
  dueCards: [],
  stats: STUB_STATS,
  hasCard: hasCardNoop,
  addCard: addCardNoop,
  removeCard: removeCardNoop,
  reviewCard: reviewCardNoop,
  resetDeck: resetDeckNoop,
};

interface MemoryDeckProviderProps {
  children: ReactNode;
}

export const MemoryDeckProvider: React.FC<MemoryDeckProviderProps> = ({
  children,
}) => (
  <MemoryDeckContext.Provider value={STUB_VALUE}>
    {children}
  </MemoryDeckContext.Provider>
);

export function useMemoryDeck(): MemoryDeckContextValue {
  const ctx = useContext(MemoryDeckContext);
  if (!ctx) {
    throw new Error('useMemoryDeck must be used within a MemoryDeckProvider');
  }
  return ctx;
}
