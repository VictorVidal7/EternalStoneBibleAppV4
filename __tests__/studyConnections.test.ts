import {
  canonicalRefKey,
  buildReverseIndex,
  getStudyConnections,
} from '../src/features/study/studyConnections';

describe('studyConnections — two-way scripture web', () => {
  describe('canonicalRefKey', () => {
    it('resolves an English book name to a canonical key', () => {
      expect(canonicalRefKey('Genesis', 1, 1)).toBe('Genesis/1/1');
    });

    it('resolves a Spanish book name to the SAME English key', () => {
      expect(canonicalRefKey('Génesis', 1, 1)).toBe('Genesis/1/1');
      expect(canonicalRefKey('Juan', 3, 16)).toBe('John/3/16');
    });

    it('returns null for an unknown book or non-finite numbers', () => {
      expect(canonicalRefKey('Nephi', 1, 1)).toBeNull();
      expect(canonicalRefKey('Genesis', NaN, 1)).toBeNull();
    });
  });

  describe('buildReverseIndex', () => {
    it('inverts a directional map (target -> sources)', () => {
      const map = {
        'Genesis/1/1': ['John/1/1', 'Psalms/33/6'],
        'Hebrews/11/3': ['John/1/1'],
      };
      const rev = buildReverseIndex(map);
      expect(rev.get('John/1/1')).toEqual(['Genesis/1/1', 'Hebrews/11/3']);
      expect(rev.get('Psalms/33/6')).toEqual(['Genesis/1/1']);
      expect(rev.get('Genesis/1/1')).toBeUndefined();
    });

    it('dedupes a source that lists the same target twice', () => {
      const rev = buildReverseIndex({'A/1/1': ['B/1/1', 'B/1/1']});
      expect(rev.get('B/1/1')).toEqual(['A/1/1']);
    });
  });

  describe('getStudyConnections (injected deps)', () => {
    const reverseIndex = buildReverseIndex({
      'Genesis/1/1': ['John/1/1'],
      'Hebrews/11/3': ['John/1/1'],
      'Colossians/1/16': ['John/1/1'],
    });
    const outgoing = () => ['Genesis/1/1', 'Revelation/1/8'];

    it('combines outgoing references and incoming referencedBy', () => {
      const web = getStudyConnections('John', 1, 1, {reverseIndex, outgoing});
      expect(web.focus).toBe('John/1/1');
      expect(web.references).toEqual(['Genesis/1/1', 'Revelation/1/8']);
      expect(web.referencedBy).toEqual([
        'Genesis/1/1',
        'Hebrews/11/3',
        'Colossians/1/16',
      ]);
      // union: Genesis/1/1 (both), Revelation/1/8, Hebrews/11/3, Colossians/1/16
      expect(web.totalConnections).toBe(4);
    });

    it('never lists the focus verse as its own connection', () => {
      const web = getStudyConnections('John', 1, 1, {
        // John/1/1 points at itself (self-edge) AND Acts/1/1 points at John/1/1.
        reverseIndex: buildReverseIndex({
          'John/1/1': ['John/1/1'],
          'Acts/1/1': ['John/1/1'],
        }),
        outgoing: () => ['John/1/1', 'Mark/1/1'],
      });
      expect(web.references).toEqual(['Mark/1/1']);
      expect(web.referencedBy).toEqual(['Acts/1/1']);
    });

    it('yields an empty web for an unknown book', () => {
      const web = getStudyConnections('Nephi', 1, 1, {
        reverseIndex,
        outgoing: () => [],
      });
      expect(web.focus).toBeNull();
      expect(web.references).toEqual([]);
      expect(web.referencedBy).toEqual([]);
      expect(web.totalConnections).toBe(0);
    });
  });

  describe('getStudyConnections (real shipped data)', () => {
    it('finds real incoming references for a popular target verse', () => {
      // John 1:1 is a curated parallel of Genesis 1:1 in the shipped map.
      const web = getStudyConnections('John', 1, 1);
      expect(web.focus).toBe('John/1/1');
      expect(web.referencedBy).toContain('Genesis/1/1');
      expect(web.totalConnections).toBeGreaterThan(0);
    });

    it('is symmetric with the Spanish spelling of the focus verse', () => {
      const en = getStudyConnections('John', 1, 1);
      const es = getStudyConnections('Juan', 1, 1);
      expect(es.focus).toBe(en.focus);
      expect(es.referencedBy).toEqual(en.referencedBy);
    });
  });
});
