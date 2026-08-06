import {
  emptyPrepNotes,
  isPrepNotesEmpty,
  setSectionNote,
  parsePrepNotesMap,
  serializePrepNotesMap,
  setMapSectionNote,
} from '../src/features/study/prepNotes';

describe('prepNotes — preparer prose model', () => {
  describe('isPrepNotesEmpty', () => {
    it('treats null/empty/whitespace-only as empty', () => {
      expect(isPrepNotesEmpty(null)).toBe(true);
      expect(isPrepNotesEmpty(emptyPrepNotes())).toBe(true);
      expect(isPrepNotesEmpty({sections: {bigIdea: '   '}, updatedAt: 1})).toBe(
        true,
      );
    });

    it('is non-empty once a section has real text', () => {
      expect(
        isPrepNotesEmpty({sections: {bigIdea: 'God so loved'}, updatedAt: 1}),
      ).toBe(false);
    });
  });

  describe('setSectionNote', () => {
    it('writes a section and advances updatedAt', () => {
      const next = setSectionNote(
        emptyPrepNotes(),
        'bigIdea',
        'Love gives',
        42,
      );
      expect(next.sections.bigIdea).toBe('Love gives');
      expect(next.updatedAt).toBe(42);
    });

    it('removes a section when set to blank', () => {
      const filled = setSectionNote(
        emptyPrepNotes(),
        'context',
        'John wrote',
        1,
      );
      const cleared = setSectionNote(filled, 'context', '   ', 2);
      expect(cleared.sections.context).toBeUndefined();
      expect(isPrepNotesEmpty(cleared)).toBe(true);
    });

    it('does not mutate the input', () => {
      const base = emptyPrepNotes();
      setSectionNote(base, 'application', 'Go and do', 1);
      expect(base.sections.application).toBeUndefined();
    });

    // Tanda "plantillas de sermón" — a template is stamped once, on the
    // FIRST real write, and never changes underneath already-written prose.
    it('stamps a proposed template on a brand-new entry', () => {
      const next = setSectionNote(
        emptyPrepNotes(),
        'tension',
        'The famine drives Naomi to Moab',
        1,
        'narrative',
      );
      expect(next.template).toBe('narrative');
    });

    it('leaves a legacy entry (no template) untouched when none is proposed', () => {
      const next = setSectionNote(
        emptyPrepNotes(),
        'bigIdea',
        'God provides',
        1,
      );
      expect(next.template).toBeUndefined();
    });

    it('keeps an already-stamped template even when a DIFFERENT one is proposed on a later write', () => {
      const first = setSectionNote(
        emptyPrepNotes(),
        'tension',
        'The famine',
        1,
        'narrative',
      );
      // A later save (e.g. a different screen's flush) proposes 'expository'
      // — the entry's own template must win, never silently switch under
      // already-written prose.
      const second = setSectionNote(
        first,
        'resolution',
        'Boaz redeems',
        2,
        'expository',
      );
      expect(second.template).toBe('narrative');
    });

    it('preserves an already-stamped template when a later write omits the argument entirely (e.g. the illustrations-bank insert flow)', () => {
      const first = setSectionNote(
        emptyPrepNotes(),
        'context',
        'Bethlehem, in the days of the judges',
        1,
        'narrative',
      );
      // No 5th argument at all — mirrors app/features/prep/illustrations
      // calling `savePrepNote(passageKey, INSERT_TARGET_SECTION, next)`.
      const second = setSectionNote(first, 'application', 'Trust God', 2);
      expect(second.template).toBe('narrative');
    });
  });

  describe('parse/serialize round-trip', () => {
    it('round-trips a populated map', () => {
      const map = setMapSectionNote({}, 'John/3/16', 'bigIdea', 'Love', 7);
      const round = parsePrepNotesMap(serializePrepNotesMap(map));
      expect(round['John/3/16'].sections.bigIdea).toBe('Love');
      expect(round['John/3/16'].updatedAt).toBe(7);
    });

    it('returns an empty map for null/garbage/non-object', () => {
      expect(parsePrepNotesMap(null)).toEqual({});
      expect(parsePrepNotesMap('not json')).toEqual({});
      expect(parsePrepNotesMap('[1,2,3]')).toEqual({});
    });

    it('drops corrupt entries but keeps good ones', () => {
      const raw = JSON.stringify({
        'John/3/16': {sections: {bigIdea: 'Love'}, updatedAt: 5},
        'Bad/1/1': {sections: 'nope', updatedAt: 'x'},
        'Empty/1/1': {sections: {context: '   '}, updatedAt: 1},
      });
      const map = parsePrepNotesMap(raw);
      expect(map['John/3/16'].sections.bigIdea).toBe('Love');
      // A row whose sections all collapse to empty is dropped.
      expect(map['Empty/1/1']).toBeUndefined();
      // A row with a non-object sections becomes empty → dropped.
      expect(map['Bad/1/1']).toBeUndefined();
    });

    // Tanda "plantillas de sermón" — every read of storage funnels through
    // `coercePrepNotes`; a `template` that doesn't survive THIS round trip
    // would silently vanish on the very next app open (the exact bug this
    // guards against — see prepNotes.ts's own docstring on the function).
    it('round-trips a valid template', () => {
      const map = setMapSectionNote(
        {},
        'Ruth/1/1',
        'tension',
        'Famine in the land',
        7,
        'narrative',
      );
      const round = parsePrepNotesMap(serializePrepNotesMap(map));
      expect(round['Ruth/1/1'].template).toBe('narrative');
    });

    it('drops a corrupt/unrecognized template value (resolves back to expository)', () => {
      const raw = JSON.stringify({
        'John/3/16': {
          sections: {bigIdea: 'Love'},
          updatedAt: 5,
          template: 'not-a-real-template',
        },
      });
      const map = parsePrepNotesMap(raw);
      expect(map['John/3/16'].template).toBeUndefined();
    });

    it('a legacy entry with no template field round-trips with none (renders as expository)', () => {
      const raw = JSON.stringify({
        'John/3/16': {sections: {bigIdea: 'Love'}, updatedAt: 5},
      });
      const map = parsePrepNotesMap(raw);
      expect(map['John/3/16'].template).toBeUndefined();
    });
  });

  describe('setMapSectionNote', () => {
    it('adds a passage entry', () => {
      const map = setMapSectionNote({}, 'John/3/16', 'context', 'Nicodemus', 1);
      expect(map['John/3/16'].sections.context).toBe('Nicodemus');
    });

    it('drops the passage entry when its last section is emptied', () => {
      const filled = setMapSectionNote({}, 'John/3/16', 'context', 'x', 1);
      const empty = setMapSectionNote(filled, 'John/3/16', 'context', '', 2);
      expect(empty['John/3/16']).toBeUndefined();
    });

    it('does not mutate the input map', () => {
      const base = setMapSectionNote({}, 'John/3/16', 'context', 'x', 1);
      setMapSectionNote(base, 'John/3/16', 'bigIdea', 'y', 2);
      expect(base['John/3/16'].sections.bigIdea).toBeUndefined();
    });

    // Tanda "plantillas de sermón" — mirrors `savePrepNote`'s real call from
    // app/features/prep/illustrations/index.tsx, which never passes a
    // `template` argument. An already-narrative entry must not lose its
    // template just because ONE caller doesn't know about templates.
    it('a write with no template argument preserves an already-stamped one', () => {
      const withTemplate = setMapSectionNote(
        {},
        'Ruth/1/1',
        'tension',
        'Famine',
        1,
        'narrative',
      );
      const afterInsert = setMapSectionNote(
        withTemplate,
        'Ruth/1/1',
        'application',
        'An illustration inserted here',
        2,
      );
      expect(afterInsert['Ruth/1/1'].template).toBe('narrative');
    });
  });
});
