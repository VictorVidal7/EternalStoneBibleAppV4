/**
 * The "Hilo profético" catalog — every OT prophecy + NT fulfillment must resolve
 * to a real canonical verse-in-range (a typo fails CI rather than shipping a
 * dead row), ids are unique, the thread is grouped in order, and every entry has
 * es/en label + note prose.
 */
import {
  MESSIANIC_PROPHECIES,
  PROPHECY_GROUP_ORDER,
  PROPHECY_GROUP_ACCENT,
  PROPHECY_GROUP_ICON,
  PROPHECY_COUNT,
  NT_QUOTED_PROPHECIES,
  isNtQuoted,
  getPropheciesByGroup,
  type ProphecyGroup,
} from '../src/features/study/messianicProphecies';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;
const esP = (translations.es as AnyRecord).prophecies as AnyRecord;
const enP = (translations.en as AnyRecord).prophecies as AnyRecord;

describe('messianicProphecies — catalog shape', () => {
  it('ships a meaningful, ordered thread', () => {
    expect(MESSIANIC_PROPHECIES.length).toBeGreaterThanOrEqual(30);
    expect(PROPHECY_COUNT).toBe(MESSIANIC_PROPHECIES.length);
  });

  it('has unique ids', () => {
    const ids = MESSIANIC_PROPHECIES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every group is one of the known movements, each with accent + icon', () => {
    for (const p of MESSIANIC_PROPHECIES) {
      expect(PROPHECY_GROUP_ORDER).toContain(p.group);
    }
    for (const g of PROPHECY_GROUP_ORDER) {
      expect(PROPHECY_GROUP_ACCENT[g]).toMatch(/^#/);
      expect(PROPHECY_GROUP_ICON[g]).toBeTruthy();
    }
  });

  it('lists groups contiguously in PROPHECY_GROUP_ORDER (a real thread)', () => {
    const seenOrder: ProphecyGroup[] = [];
    for (const p of MESSIANIC_PROPHECIES) {
      if (seenOrder[seenOrder.length - 1] !== p.group) seenOrder.push(p.group);
    }
    // No group reappears after another started, and the order matches.
    expect(new Set(seenOrder).size).toBe(seenOrder.length);
    expect(seenOrder).toEqual(
      PROPHECY_GROUP_ORDER.filter(g => seenOrder.includes(g)),
    );
  });
});

describe('messianicProphecies — every reference is real', () => {
  const checkRef = (label: string, ref: string, bad: string[]) => {
    const parsed = parseChristRef(ref);
    if (!parsed) {
      bad.push(`${label}: unparseable "${ref}"`);
      return;
    }
    const book = getBookByName(parsed.book);
    if (!book) {
      bad.push(`${label}: unknown book "${parsed.book}" in "${ref}"`);
      return;
    }
    if (book.nameEn !== parsed.book) {
      bad.push(`${label}: non-canonical book "${parsed.book}"`);
    }
    if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
      bad.push(`${label}: chapter ${parsed.chapter} out of range for ${ref}`);
    }
  };

  it('resolves both the prophecy and the fulfillment of every entry', () => {
    const bad: string[] = [];
    for (const p of MESSIANIC_PROPHECIES) {
      checkRef(`${p.id} prophecy`, p.prophecy, bad);
      checkRef(`${p.id} fulfillment`, p.fulfillment, bad);
    }
    expect(bad).toEqual([]);
  });
});

describe('messianicProphecies — i18n parity', () => {
  it('has es/en group titles for every movement', () => {
    const esGroups = esP.groups as AnyRecord;
    const enGroups = enP.groups as AnyRecord;
    for (const g of PROPHECY_GROUP_ORDER) {
      expect(typeof esGroups[g]).toBe('string');
      expect(typeof enGroups[g]).toBe('string');
    }
  });

  it('has a label + note in BOTH languages for every prophecy', () => {
    const esItems = esP.items as Record<string, AnyRecord>;
    const enItems = enP.items as Record<string, AnyRecord>;
    const bad: string[] = [];
    for (const p of MESSIANIC_PROPHECIES) {
      for (const [lang, items] of [
        ['es', esItems],
        ['en', enItems],
      ] as const) {
        const item = items[p.id];
        if (!item) {
          bad.push(`${lang}: missing item ${p.id}`);
          continue;
        }
        if (typeof item.label !== 'string' || !item.label) {
          bad.push(`${lang}: ${p.id} missing label`);
        }
        if (typeof item.note !== 'string' || !item.note) {
          bad.push(`${lang}: ${p.id} missing note`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan i18n items (every keyed item is in the catalog)', () => {
    const ids = new Set(MESSIANIC_PROPHECIES.map(p => p.id));
    for (const key of Object.keys(esP.items as AnyRecord)) {
      expect(ids.has(key)).toBe(true);
    }
  });
});

describe('messianicProphecies — NT-quoted set', () => {
  it('only references real catalog ids (no orphans)', () => {
    const ids = new Set(MESSIANIC_PROPHECIES.map(p => p.id));
    for (const id of NT_QUOTED_PROPHECIES) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('isNtQuoted mirrors the set', () => {
    for (const p of MESSIANIC_PROPHECIES) {
      expect(isNtQuoted(p.id)).toBe(NT_QUOTED_PROPHECIES.has(p.id));
    }
  });
});

describe('getPropheciesByGroup', () => {
  it('returns the movements in order with correct global indices', () => {
    const sections = getPropheciesByGroup();
    expect(sections.map(s => s.group)).toEqual(
      PROPHECY_GROUP_ORDER.filter(g =>
        MESSIANIC_PROPHECIES.some(p => p.group === g),
      ),
    );
    const flat = sections.flatMap(s => s.entries);
    expect(flat.length).toBe(PROPHECY_COUNT);
    // Each entry's index points back at the same prophecy in the catalog.
    for (const {prophecy, index} of flat) {
      expect(MESSIANIC_PROPHECIES[index]).toBe(prophecy);
    }
  });
});
