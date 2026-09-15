/**
 * R9-50 / R9-44 — the two halves of `HighlightService`'s write contract that
 * the reader and the highlights editor both depend on, and that nothing
 * covered before.
 *
 * R9-50: clearing a highlight's note used to be a COMPLETE no-op that still
 * toasted "Guardado". `updateHighlight` only put a column in the `SET` when
 * the field was `!== undefined`, but the editor mapped an emptied field to
 * `undefined` — so SQLite kept the old value, the queued payload omitted the
 * key, `pushOne`'s `{merge: true}` kept Firestore's copy too, and the note
 * reappeared intact on the next focus. There was no way to remove a
 * highlight note anywhere in the app. The fix makes the field tri-state:
 * `undefined` = leave alone, `null` = the user cleared it.
 *
 * R9-44: recolouring a verse from the reader called `addHighlight` with five
 * arguments, and that is an `INSERT OR REPLACE` against `UNIQUE(verse_id)` —
 * it wrote NULL over the category and note the reader had written, and reset
 * `created_at`. The colour-only path must now be an UPDATE that touches
 * nothing else.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {HighlightService} from '../src/lib/highlights/HighlightService';
import {
  HighlightColor,
  HighlightCategory,
  type Highlight,
} from '../src/lib/highlights';

interface RecordedSql {
  sql: string;
  params: unknown[];
}

const EXISTING_ROW = {
  id: 'highlight_Juan:3:16_1',
  verse_id: 'Juan:3:16',
  book_id: 'Juan',
  chapter: 3,
  verse: 16,
  color: HighlightColor.YELLOW,
  category: HighlightCategory.PROMISE,
  note: 'la nota que escribí a mano',
  created_at: 1000,
  updated_at: 2000,
};

function makeService(): {service: HighlightService; sqls: RecordedSql[]} {
  const sqls: RecordedSql[] = [];
  const fakeDb = {
    async executeSql(sql: string, params: unknown[] = []) {
      sqls.push({sql, params});
      if (sql.startsWith('SELECT * FROM highlights WHERE verse_id')) {
        return {rows: {length: 1, _array: [EXISTING_ROW]}};
      }
      return {rows: {length: 0, _array: []}};
    },
  };
  // The service only ever touches `executeSql` on these paths.
  const service = new HighlightService(
    fakeDb as unknown as ConstructorParameters<typeof HighlightService>[0],
  );
  return {service, sqls};
}

/** The single UPDATE the call under test produced. */
function theUpdate(sqls: RecordedSql[]): RecordedSql {
  const updates = sqls.filter(s => s.sql.startsWith('UPDATE highlights SET'));
  expect(updates).toHaveLength(1);
  return updates[0];
}

describe('R9-50 — updateHighlight is tri-state', () => {
  it('null CLEARS the note (the column reaches the SET, bound to NULL)', async () => {
    const {service, sqls} = makeService();
    const saved: Highlight = await service.updateHighlight('Juan:3:16', {
      note: null,
    });
    const update = theUpdate(sqls);
    // Pre-fix the `!== undefined` guard dropped the column entirely and the
    // statement degenerated to `SET updated_at = ?` — a write that changed
    // no data at all while the UI said "Guardado".
    expect(update.sql).toContain('note = ?');
    expect(update.params[0]).toBeNull();
    expect(saved.note).toBeUndefined();
  });

  it('null CLEARS the category too', async () => {
    const {service, sqls} = makeService();
    const saved = await service.updateHighlight('Juan:3:16', {category: null});
    const update = theUpdate(sqls);
    expect(update.sql).toContain('category = ?');
    expect(update.params[0]).toBeNull();
    expect(saved.category).toBeUndefined();
  });

  it('undefined still means "leave this column alone"', async () => {
    const {service, sqls} = makeService();
    const saved = await service.updateHighlight('Juan:3:16', {
      color: HighlightColor.GREEN,
    });
    const update = theUpdate(sqls);
    expect(update.sql).not.toContain('note = ?');
    expect(update.sql).not.toContain('category = ?');
    // …and the returned entity carries the untouched values forward.
    expect(saved.note).toBe('la nota que escribí a mano');
    expect(saved.category).toBe(HighlightCategory.PROMISE);
  });

  it('returns the entity it actually wrote, with its own updated_at', async () => {
    const {service, sqls} = makeService();
    const saved = await service.updateHighlight('Juan:3:16', {
      note: 'texto nuevo',
    });
    const update = theUpdate(sqls);
    const writtenUpdatedAt = update.params[update.params.length - 2];
    // The caller hands this straight to queueWrite; a second Date.now() there
    // would disagree with what SQLite holds.
    expect(saved.updatedAt).toBe(writtenUpdatedAt);
    expect(saved.note).toBe('texto nuevo');
  });

  it('throws for a verse with no highlight instead of writing anything', async () => {
    const sqls: RecordedSql[] = [];
    const emptyDb = {
      async executeSql(sql: string, params: unknown[] = []) {
        sqls.push({sql, params});
        return {rows: {length: 0, _array: []}};
      },
    };
    const service = new HighlightService(
      emptyDb as unknown as ConstructorParameters<typeof HighlightService>[0],
    );
    await expect(
      service.updateHighlight('Juan:3:17', {note: null}),
    ).rejects.toThrow(/Highlight not found/);
    expect(sqls.some(s => s.sql.startsWith('UPDATE'))).toBe(false);
  });
});

describe('R9-44 — why the reader must not recolour via addHighlight', () => {
  /**
   * This pins the MECHANISM, not the screen. The defect itself lived in
   * `app/(tabs)/verse/[book]/[chapter].tsx`, which called `addHighlight` with
   * five arguments to recolour an existing highlight; the fix branches to a
   * colour-only `updateHighlight` when the verse already has one. That branch
   * is a reader-screen behaviour and belongs to device verification (Modo C)
   * — what IS pinned here is the destructive property that makes the branch
   * necessary, so nobody re-points the reader at `addHighlight` believing it
   * is a harmless upsert.
   */
  it('addHighlight with five args writes NULL over category and note', async () => {
    const {service, sqls} = makeService();
    await service.addHighlight(
      'Juan:3:16',
      'Juan',
      3,
      16,
      HighlightColor.GREEN,
    );
    const insert = sqls.find(s => s.sql.includes('INSERT OR REPLACE'))!;
    expect(insert).toBeDefined();
    // Positions 6 and 7 are category and note. `UNIQUE(verse_id)` means this
    // REPLACEs the existing row — prose and all — and resets created_at.
    expect(insert.params[6]).toBeNull();
    expect(insert.params[7]).toBeNull();
    expect(insert.params[8]).not.toBe(1000);
  });

  it('the colour-only UPDATE the fix uses instead preserves both', async () => {
    const {service, sqls} = makeService();
    const saved = await service.updateHighlight('Juan:3:16', {
      color: HighlightColor.GREEN,
    });
    const update = theUpdate(sqls);

    expect(update.sql).toContain('color = ?');
    expect(update.sql).not.toContain('note = ?');
    expect(update.sql).not.toContain('category = ?');
    expect(update.sql).not.toContain('created_at');
    // No INSERT OR REPLACE anywhere — that was the mechanism that wrote NULL
    // over both columns via the UNIQUE(verse_id) constraint.
    expect(sqls.some(s => s.sql.includes('INSERT OR REPLACE'))).toBe(false);

    expect(saved.color).toBe(HighlightColor.GREEN);
    expect(saved.note).toBe('la nota que escribí a mano');
    expect(saved.category).toBe(HighlightCategory.PROMISE);
    expect(saved.createdAt).toBe(1000);
  });
});
