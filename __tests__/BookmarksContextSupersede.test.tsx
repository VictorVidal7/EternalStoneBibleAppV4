/**
 * Regression coverage for the Firestore-supersede cleanup gap found
 * alongside the bookmark cross-version-language canonicalization fix
 * (d58837f): `addBookmark` dedupes/canonicalizes LOCALLY (one entry per
 * canonical verse — see bookmarkOps.dedupeAndPrepend) but the superseded
 * entry gets a brand-new random Firestore doc id assigned to its
 * replacement, so without an explicit delete the OLD doc stayed live in
 * Firestore forever. A fresh sync attach (reinstall / new device / cursor
 * reset) would then redeliver BOTH docs — applyRemoteUpsert only dedups by
 * doc id, not by verse — resurrecting the exact duplicate-bookmark bug the
 * canonicalization fix was meant to eliminate, just reachable via sync
 * instead of via direct re-bookmarking.
 *
 * These tests mock only `getSyncEngine` (from `@lib/sync`) so we can
 * observe exactly which `queueWrite`/`queueDelete` calls addBookmark makes,
 * while everything else (AsyncStorage persistence, canonicalization,
 * dedupe) runs for real.
 */

import React from 'react';
import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockQueueWrite = jest.fn();
const mockQueueDelete = jest.fn();
const mockEngineStub = {
  queueWrite: mockQueueWrite,
  queueDelete: mockQueueDelete,
};

jest.mock('../src/lib/sync', () => {
  const actual = jest.requireActual('../src/lib/sync');
  return {
    ...actual,
    __esModule: true,
    getSyncEngine: () => mockEngineStub,
  };
});

import {
  BookmarksProvider,
  useBookmarks,
  type BookmarksContextType,
} from '../src/context/BookmarksContext';

let captured: BookmarksContextType | null = null;
function Capture() {
  captured = useBookmarks();
  return <Text>{captured.bookmarks.length}</Text>;
}

/** Mount the provider and wait until hydration settles. */
async function mountAndSettle() {
  render(
    <BookmarksProvider>
      <Capture />
    </BookmarksProvider>,
  );
  await waitFor(() => expect(captured?.loading).toBe(false));
}

describe('BookmarksContext.addBookmark — Firestore supersede cleanup', () => {
  beforeEach(async () => {
    captured = null;
    mockQueueWrite.mockClear();
    mockQueueDelete.mockClear();
    // The AsyncStorage mock persists across tests — clear the bookmark
    // blob so one test's data doesn't hydrate into the next.
    await AsyncStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('queues a delete for the OLD doc when a re-bookmark canonicalizes across version languages', async () => {
    await mountAndSettle();

    let firstId = '';
    await act(async () => {
      const first = await captured!.addBookmark({
        book: 'Genesis', // bookmarked while reading the English version
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created...',
      });
      firstId = first.id;
    });
    await waitFor(() => expect(captured!.bookmarks).toHaveLength(1));
    expect(mockQueueWrite).toHaveBeenCalledTimes(1);
    expect(mockQueueDelete).not.toHaveBeenCalled();

    await act(async () => {
      await captured!.addBookmark({
        book: 'Génesis', // same verse, but reading the Spanish version
        chapter: 1,
        verse: 1,
        text: 'En el principio creó Dios...',
      });
    });

    // The local list still collapses to exactly one entry (the
    // canonicalization/dedupe fix keeps working)...
    await waitFor(() => expect(captured!.bookmarks).toHaveLength(1));
    expect(captured!.bookmarks[0].id).not.toBe(firstId);

    // ...but the superseded doc's OLD id must be explicitly queued for
    // deletion, or it would stay live in Firestore forever and get
    // redelivered on a fresh sync attach.
    expect(mockQueueDelete).toHaveBeenCalledTimes(1);
    expect(mockQueueDelete).toHaveBeenCalledWith(
      'bookmarks',
      firstId,
      expect.objectContaining({book: 'Genesis', chapter: 1, verse: 1}),
    );
    // One write per add — the delete does not add extra writes.
    expect(mockQueueWrite).toHaveBeenCalledTimes(2);
  });

  it('does not queue a delete when the new bookmark has no local collision', async () => {
    await mountAndSettle();

    await act(async () => {
      await captured!.addBookmark({
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        text: 'In the beginning God created...',
      });
    });
    await act(async () => {
      await captured!.addBookmark({
        book: 'Romans',
        chapter: 8,
        verse: 28,
        text: 'And we know that all things work together...',
      });
    });

    await waitFor(() => expect(captured!.bookmarks).toHaveLength(2));
    expect(mockQueueWrite).toHaveBeenCalledTimes(2);
    expect(mockQueueDelete).not.toHaveBeenCalled();
  });

  it('queues a delete for a same-language re-bookmark too (the pre-existing dedupe path)', async () => {
    await mountAndSettle();

    let firstId = '';
    await act(async () => {
      const first = await captured!.addBookmark({
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world...',
      });
      firstId = first.id;
    });

    await act(async () => {
      await captured!.addBookmark({
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world... (re-saved)',
      });
    });

    await waitFor(() => expect(captured!.bookmarks).toHaveLength(1));
    expect(mockQueueDelete).toHaveBeenCalledTimes(1);
    expect(mockQueueDelete).toHaveBeenCalledWith(
      'bookmarks',
      firstId,
      expect.anything(),
    );
  });
});
