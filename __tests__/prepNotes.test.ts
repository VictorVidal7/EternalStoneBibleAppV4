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
  });
});
