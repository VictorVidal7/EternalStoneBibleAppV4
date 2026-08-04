/**
 * 🔖 BOOKMARKS CONTEXT
 *
 * Multiple named bookmarks — distinct from the single "Continue Reading"
 * position the reader tracks automatically. Each bookmark snapshots a
 * verse the user explicitly chose to save (with an optional label) so
 * they can come back to a specific spot — a sermon prep position, a
 * passage they want to revisit, etc.
 *
 * Persisted in AsyncStorage rather than SQLite: the dataset is small
 * (the user manages it manually), it avoids a schema migration, and
 * keeping it off the verses DB means the "Reset Bible Data" flow (which
 * clears verses) won't nuke the user's bookmarks.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {canonicalBookName} from '../constants/bible';
import {logger} from '../lib/utils/logger';
import {
  dedupeAndPrepend,
  isBookmarkedAt,
  removeById,
  renameById,
} from './bookmarkOps';
import {
  getSyncEngine,
  withoutUndefined,
  type SyncAdapter,
  type SyncEntity,
} from '../lib/sync';
import {useSyncEngineOptional} from './SyncEngineContext';

export interface Bookmark {
  id: string;
  // Canonical (English) book identity — see canonicalBookName. addBookmark
  // canonicalizes on write so a verse bookmarked while reading any
  // version-language ("Juan"/"John") collapses to one entry (Sprint 58
  // bug class, same fix as favorites/highlights/notes/audio bookmarks).
  book: string;
  chapter: number;
  verse: number;
  text: string; // verse snippet for the list preview
  label?: string; // optional user-chosen name ("Sunday sermon")
  createdAt: number;
  /** Sprint 42: required for last-write-wins sync. Backfilled to
   *  createdAt (or Date.now()) on hydration of older blobs. */
  updatedAt: number;
}

export interface BookmarksContextType {
  bookmarks: Bookmark[];
  loading: boolean;
  addBookmark: (
    input: Pick<Bookmark, 'book' | 'chapter' | 'verse' | 'text'> & {
      label?: string;
    },
  ) => Promise<Bookmark>;
  removeBookmark: (id: string) => Promise<void>;
  renameBookmark: (id: string, label: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isBookmarked: (book: string, chapter: number, verse: number) => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(
  undefined,
);

const STORAGE_KEY = '@bible_bookmarks';

function generateId(): string {
  return `bm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface BookmarksProviderProps {
  children: ReactNode;
}

// withoutUndefined drops an absent `label` — addBookmark builds the row with
// `label: input.label`, so a label-less bookmark carried the key explicitly
// and Firestore rejected every push (same flaw as favorites' note, S77).
function bookmarkToRemote(b: Bookmark): SyncEntity<Bookmark> {
  return withoutUndefined({...b, updatedAt: b.updatedAt});
}

export const BookmarksProvider: FC<BookmarksProviderProps> = ({children}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const syncCtx = useSyncEngineOptional();
  // Sprint 45 — see FavoritesContext: depend on the stable engine ref,
  // not the context value, so the adapter registers once instead of
  // re-subscribing on every engine state tick.
  const syncEngine = syncCtx?.engine ?? null;

  const bookmarksRef = useRef<Bookmark[]>([]);
  useEffect(() => {
    bookmarksRef.current = bookmarks;
  }, [bookmarks]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const hydrated: Bookmark[] = [];
            for (const b of parsed) {
              if (
                typeof b?.id === 'string' &&
                typeof b?.book === 'string' &&
                typeof b?.chapter === 'number' &&
                typeof b?.verse === 'number'
              ) {
                // Sprint 42 backfill: blobs predating this sprint don't
                // carry `updatedAt`. Fall back to createdAt (or now) so
                // LWW compares stay deterministic.
                hydrated.push({
                  ...(b as Bookmark),
                  updatedAt:
                    typeof (b as Bookmark).updatedAt === 'number'
                      ? (b as Bookmark).updatedAt
                      : typeof (b as Bookmark).createdAt === 'number'
                        ? (b as Bookmark).createdAt
                        : Date.now(),
                });
              }
            }
            setBookmarks(hydrated);
            // Persist the backfilled blob immediately so the next
            // hydrate is a no-op (and so the engine's queue picks up
            // the correct updatedAt on first sync).
            try {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
            } catch {
              // Best-effort — the next mutation will persist anyway.
            }
          }
        }
      } catch (error) {
        logger.error('Failed to load bookmarks', error as Error, {
          component: 'BookmarksProvider',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Register sync adapter.
  useEffect(() => {
    if (!syncEngine) return;
    const adapter: SyncAdapter<Bookmark> = {
      collection: 'bookmarks',
      async getLocal(id) {
        const b = bookmarksRef.current.find(x => x.id === id);
        return b ? bookmarkToRemote(b) : null;
      },
      async applyRemoteUpsert(id, data) {
        const incoming: Bookmark = {
          id,
          book: data.book,
          chapter: data.chapter,
          verse: data.verse,
          text: data.text,
          label: data.label,
          createdAt:
            typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt:
            typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        };
        setBookmarks(prev => {
          const idx = prev.findIndex(b => b.id === id);
          let next: Bookmark[];
          if (idx >= 0) {
            next = [...prev];
            next[idx] = incoming;
          } else {
            next = [incoming, ...prev];
          }
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
            () => undefined,
          );
          return next;
        });
      },
      async applyRemoteDelete(id) {
        setBookmarks(prev => {
          const next = prev.filter(b => b.id !== id);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
            () => undefined,
          );
          return next;
        });
      },
      async pullAllLocal() {
        return bookmarksRef.current.map(b => ({
          id: b.id,
          data: bookmarkToRemote(b),
        }));
      },
      // Sprint 43 — only the user-supplied label is editable post-create.
      getMaterialFields() {
        return ['label'] as const;
      },
    };
    syncEngine.register(adapter);
    return () => {
      syncEngine.unregister('bookmarks');
    };
  }, [syncEngine]);

  const persist = useCallback(async (next: Bookmark[]) => {
    setBookmarks(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      logger.error('Failed to persist bookmarks', error as Error, {
        component: 'BookmarksProvider',
      });
    }
  }, []);

  const addBookmark: BookmarksContextType['addBookmark'] = useCallback(
    async input => {
      const now = Date.now();
      // Canonicalize the book identity so a verse is keyed the same way no
      // matter which version-language the reader was on when it was
      // bookmarked ("Juan" vs "John") — see canonicalBookName, and compare
      // to FavoritesContext.addFavorite which does the same.
      const bookmark: Bookmark = {
        id: generateId(),
        book: canonicalBookName(input.book),
        chapter: input.chapter,
        verse: input.verse,
        text: input.text,
        label: input.label,
        createdAt: now,
        updatedAt: now,
      };
      // Dedupe + MRU prepend lives in a pure helper (see bookmarkOps.ts)
      // so it can be unit-tested without rendering the provider.
      await persist(dedupeAndPrepend(bookmarks, bookmark));
      getSyncEngine()?.queueWrite(
        'bookmarks',
        bookmark.id,
        bookmarkToRemote(bookmark),
      );
      return bookmark;
    },
    [bookmarks, persist],
  );

  const removeBookmark = useCallback(
    async (id: string) => {
      const lastKnown = bookmarks.find(b => b.id === id);
      await persist(removeById(bookmarks, id));
      getSyncEngine()?.queueDelete(
        'bookmarks',
        id,
        lastKnown ? bookmarkToRemote(lastKnown) : undefined,
      );
    },
    [bookmarks, persist],
  );

  const renameBookmark = useCallback(
    async (id: string, label: string) => {
      const next = renameById(bookmarks, id, label).map(b =>
        b.id === id ? {...b, updatedAt: Date.now()} : b,
      );
      await persist(next);
      const renamed = next.find(b => b.id === id);
      if (renamed) {
        getSyncEngine()?.queueWrite(
          'bookmarks',
          renamed.id,
          bookmarkToRemote(renamed),
        );
      }
    },
    [bookmarks, persist],
  );

  const clearAll = useCallback(async () => {
    const engine = getSyncEngine();
    if (engine) {
      // Queue a tombstone for every bookmark so the clear propagates.
      for (const b of bookmarks) {
        engine.queueDelete('bookmarks', b.id, bookmarkToRemote(b));
      }
    }
    await persist([]);
  }, [bookmarks, persist]);

  const isBookmarked = useCallback(
    (book: string, chapter: number, verse: number) =>
      isBookmarkedAt(bookmarks, book, chapter, verse),
    [bookmarks],
  );

  const value = useMemo<BookmarksContextType>(
    () => ({
      bookmarks,
      loading,
      addBookmark,
      removeBookmark,
      renameBookmark,
      clearAll,
      isBookmarked,
    }),
    [
      bookmarks,
      loading,
      addBookmark,
      removeBookmark,
      renameBookmark,
      clearAll,
      isBookmarked,
    ],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
};

export function useBookmarks(): BookmarksContextType {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return ctx;
}
