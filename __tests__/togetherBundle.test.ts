/**
 * Sprint 107 — together bundle codec (link + short code).
 * Round trips, untrusted-input hardening, and code typo-tolerance.
 */

import {
  TOGETHER_BUNDLE_VERSION,
  GROUP_NAME_MAX,
  PLAN_NAME_MAX,
  MAX_PLAN_DAYS,
  MAX_DAY_READINGS,
  STUDY_TITLE_MAX,
  STUDY_NOTE_KEYS_MAX,
  CAL_TITLE_MAX,
  CAL_NOTE_MAX,
  MAX_CAL_DAYS,
  type CustomReading,
} from '@/lib/together/types';
import {
  TOGETHER_LINK_PREFIX,
  addDaysISO,
  decodePlanCode,
  decodeTogetherParam,
  encodeBundleLink,
  encodeBundleParam,
  encodeCalLink,
  encodeHttpsLink,
  encodePlanCode,
  encodeStudyLink,
  ETERNAL_WEB_BASE,
  extractSharedLinkPayload,
  makeCalBundle,
  makeCustomPlanBundle,
  makePlanBundle,
  makeStudyBundle,
  sanitizeGroupName,
  sanitizeNote,
  sanitizePlanName,
  todayDateISO,
} from '@/lib/together/bundle';

const PLAN_IDS = ['nt-30', 'proverbs', 'psalms-30', 'bible-year'];
const TAB = String.fromCharCode(9);
const CTRL = String.fromCharCode(0, 7, 31, 127); // NUL, BEL, US, DEL

/** Pull the `d=` param out of a together link. */
function param(link: string): string {
  return link.slice(link.indexOf('?d=') + 3);
}

describe('makePlanBundle', () => {
  it('builds a versioned plan bundle', () => {
    expect(makePlanBundle('nt-30', '2026-06-22')).toEqual({
      v: TOGETHER_BUNDLE_VERSION,
      t: 'plan',
      p: 'nt-30',
      s: '2026-06-22',
    });
  });

  it('attaches a sanitized group name when given', () => {
    expect(makePlanBundle('nt-30', '2026-06-22', '  Familia  ').g).toBe(
      'Familia',
    );
  });

  it('omits the group name when it sanitizes to empty', () => {
    expect(makePlanBundle('nt-30', '2026-06-22', '   ').g).toBeUndefined();
  });
});

describe('encodeBundleLink / decodeTogetherParam', () => {
  it('round-trips a plan with no group name', () => {
    const bundle = makePlanBundle('nt-30', '2026-06-22');
    const res = decodeTogetherParam(param(encodeBundleLink(bundle)));
    expect(res).toEqual({ok: true, bundle});
  });

  it('round-trips a group name with accents and emoji', () => {
    const bundle = makePlanBundle(
      'proverbs',
      '2026-12-01',
      'Célula 🙏 Galilea',
    );
    const res = decodeTogetherParam(param(encodeBundleLink(bundle)));
    expect(res).toEqual({ok: true, bundle});
    if (res.ok && res.bundle.t === 'plan')
      expect(res.bundle.g).toBe('Célula 🙏 Galilea');
  });

  it('encodeBundleParam yields the same payload the link carries', () => {
    const bundle = makePlanBundle('nt-30', '2026-06-22', 'Familia');
    expect(`${TOGETHER_LINK_PREFIX}?d=${encodeBundleParam(bundle)}`).toBe(
      encodeBundleLink(bundle),
    );
    expect(decodeTogetherParam(encodeBundleParam(bundle))).toEqual({
      ok: true,
      bundle,
    });
  });

  it('produces a URL-safe link (scheme + only base64url chars)', () => {
    const link = encodeBundleLink(makePlanBundle('nt-30', '2026-06-22', 'Hi'));
    expect(link.startsWith(`${TOGETHER_LINK_PREFIX}?d=`)).toBe(true);
    expect(param(link)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('encodeHttpsLink puts the same payload in the #fragment (clickable share)', () => {
    const bundle = makePlanBundle('nt-30', '2026-06-22', 'Familia');
    const link = encodeHttpsLink(bundle);
    expect(link.startsWith(`${ETERNAL_WEB_BASE}#d=`)).toBe(true);
    // The host only ever sees the path — the payload lives after the # so it is
    // never sent to the server (zero-knowledge).
    expect(link.indexOf('?')).toBe(-1);
    const frag = link.slice(link.indexOf('#d=') + 3);
    expect(frag).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeTogetherParam(frag)).toEqual({ok: true, bundle});
  });

  it('encodeHttpsLink round-trips a study bundle through the same redirector', () => {
    const study = makeStudyBundle(
      {bookId: 43, chapter: 3, startVerse: 16, endVerse: 21},
      'Pastor Daniel',
      {bigIdea: 'Dios amó al mundo'},
    );
    const link = encodeHttpsLink(study);
    expect(link.startsWith(`${ETERNAL_WEB_BASE}#d=`)).toBe(true);
    const res = decodeTogetherParam(link.slice(link.indexOf('#d=') + 3));
    expect(res).toEqual({ok: true, bundle: study});
  });

  it('rejects empty / garbage / non-base64 input', () => {
    expect(decodeTogetherParam('')).toEqual({ok: false, reason: 'format'});
    expect(decodeTogetherParam('!!!!')).toEqual({ok: false, reason: 'format'});
    expect(decodeTogetherParam('not base64 +/=')).toEqual({
      ok: false,
      reason: 'format',
    });
  });

  it('rejects valid base64 that is not a JSON object', () => {
    const notJson = encodeBundleLink('hello' as never); // base64url of a string
    expect(decodeTogetherParam(param(notJson)).ok).toBe(false);
  });

  it('rejects a bundle from a newer format version', () => {
    const link = encodeBundleLink({
      v: TOGETHER_BUNDLE_VERSION + 1,
      t: 'plan',
      p: 'nt-30',
      s: '2026-06-22',
    } as never);
    expect(decodeTogetherParam(param(link))).toEqual({
      ok: false,
      reason: 'version',
    });
  });

  it('flags a known-shaped-but-unsupported future type', () => {
    // A structurally valid object whose type tag this build doesn't know yet
    // (a future bundle kind) reads as unsupported, not malformed. ('cal' is
    // now implemented — Sprint 110 — so use a not-yet-built tag here.)
    const link = encodeBundleLink({v: 1, t: 'memorize', x: 1} as never);
    expect(decodeTogetherParam(param(link))).toEqual({
      ok: false,
      reason: 'unsupported',
    });
  });

  it('rejects an impossible calendar date', () => {
    const link = encodeBundleLink({
      v: 1,
      t: 'plan',
      p: 'nt-30',
      s: '2026-02-31',
    } as never);
    expect(decodeTogetherParam(param(link))).toEqual({
      ok: false,
      reason: 'format',
    });
  });

  it('re-sanitizes a malicious group name on decode (untrusted input)', () => {
    const evil = 'A'.repeat(200) + CTRL + '  evil';
    const link = encodeBundleLink({
      v: 1,
      t: 'plan',
      p: 'nt-30',
      s: '2026-06-22',
      g: evil,
    } as never);
    const res = decodeTogetherParam(param(link));
    expect(res.ok).toBe(true);
    if (res.ok && res.bundle.t === 'plan') {
      expect(res.bundle.g).toBe('A'.repeat(GROUP_NAME_MAX));
    }
  });
});

describe('extractSharedLinkPayload (App Link autoVerify)', () => {
  it('recovers the #fragment payload from a direct App Link open', () => {
    const bundle = makePlanBundle('nt-30', '2026-06-22', 'Familia');
    const link = encodeHttpsLink(bundle); // https://…/o/#d=<payload>
    const payload = extractSharedLinkPayload(link);
    expect(payload).not.toBeNull();
    expect(decodeTogetherParam(payload as string)).toEqual({ok: true, bundle});
  });

  it('round-trips a study bundle through a direct App Link open', () => {
    const study = makeStudyBundle(
      {bookId: 43, chapter: 3, startVerse: 16, endVerse: 21},
      'Pastor Daniel',
      {bigIdea: 'Dios amó al mundo'},
    );
    const payload = extractSharedLinkPayload(encodeHttpsLink(study));
    expect(decodeTogetherParam(payload as string)).toEqual({
      ok: true,
      bundle: study,
    });
  });

  it('accepts a ?d= query variant and a missing trailing slash', () => {
    const base = ETERNAL_WEB_BASE.replace(/\/+$/, ''); // …/o
    expect(extractSharedLinkPayload(`${base}#d=ABC-_123`)).toBe('ABC-_123');
    expect(extractSharedLinkPayload(`${base}/?d=ABC-_123`)).toBe('ABC-_123');
    expect(extractSharedLinkPayload(`${base}/index.html#d=XYZ`)).toBe('XYZ');
  });

  it('leaves the eternalbible:// scheme links and foreign URLs untouched', () => {
    // Scheme links are routed natively by Expo Router — never rewrite them.
    expect(
      extractSharedLinkPayload('eternalbible://features/together?d=ABC'),
    ).toBeNull();
    expect(
      extractSharedLinkPayload('eternalbible://features/study-shared?d=ABC'),
    ).toBeNull();
    // A look-alike host must not match.
    expect(
      extractSharedLinkPayload('https://evil.example.com/o/#d=ABC'),
    ).toBeNull();
    expect(
      extractSharedLinkPayload('https://eternalstonebible.github.io/'),
    ).toBe(null);
  });

  it('returns null for an empty payload or non-string input', () => {
    const base = ETERNAL_WEB_BASE.replace(/\/+$/, '');
    expect(extractSharedLinkPayload(`${base}/#d=`)).toBeNull();
    // @ts-expect-error — defends against a non-string at the JS boundary.
    expect(extractSharedLinkPayload(undefined)).toBeNull();
  });
});

describe('sanitizeGroupName', () => {
  it('strips control chars, collapses whitespace, trims, and caps length', () => {
    expect(sanitizeGroupName('  hola' + TAB + 'mundo  ')).toBe('hola mundo');
    expect(sanitizeGroupName('x'.repeat(100)).length).toBe(GROUP_NAME_MAX);
    expect(sanitizeGroupName('a' + CTRL + 'b')).toBe('ab');
  });
});

describe('encodePlanCode / decodePlanCode', () => {
  it('round-trips plan id + start date (no group)', () => {
    const code = encodePlanCode('nt-30', '2026-06-22');
    expect(code).not.toBeNull();
    const res = decodePlanCode(code!, PLAN_IDS);
    expect(res).toEqual({
      ok: true,
      bundle: {
        v: TOGETHER_BUNDLE_VERSION,
        t: 'plan',
        p: 'nt-30',
        s: '2026-06-22',
      },
    });
  });

  it('emits a short, typeable, EB1-prefixed code', () => {
    const code = encodePlanCode('proverbs', '2026-06-22')!;
    expect(code.startsWith('EB1-')).toBe(true);
    expect(code).toMatch(/^[A-Z0-9-]+$/);
  });

  it('is tolerant of lowercase, spaces, and ambiguous glyphs', () => {
    const code = encodePlanCode('nt-30', '2026-06-22')!;
    const messy = code.toLowerCase().replace(/-/g, ' ');
    expect(decodePlanCode(messy, PLAN_IDS)).toEqual(
      decodePlanCode(code, PLAN_IDS),
    );
  });

  it('rejects wrong prefix, bad shape, and unknown plan token', () => {
    expect(decodePlanCode('XX1-ABC-NT30', PLAN_IDS).ok).toBe(false);
    expect(decodePlanCode('EB1-ABC', PLAN_IDS).ok).toBe(false);
    expect(decodePlanCode('EB1-ABC-NOPE', PLAN_IDS)).toEqual({
      ok: false,
      reason: 'unknown-plan',
    });
  });

  it('returns null for an out-of-range date', () => {
    expect(encodePlanCode('nt-30', '1999-01-01')).toBeNull();
  });

  it('matches plan tokens regardless of dashes in the id', () => {
    const code = encodePlanCode('bible-year', '2026-06-22')!;
    const res = decodePlanCode(code, PLAN_IDS);
    expect(res.ok && res.bundle.t === 'plan' && res.bundle.p).toBe(
      'bible-year',
    );
  });
});

describe('makeCustomPlanBundle', () => {
  it('builds a versioned cplan bundle with a sanitized name', () => {
    const b = makeCustomPlanBundle('  Juan en 7 días  ', [
      [
        [43, 1],
        [43, 2],
      ],
      [[43, 3]],
    ]);
    expect(b).toEqual({
      v: TOGETHER_BUNDLE_VERSION,
      t: 'cplan',
      n: 'Juan en 7 días',
      d: [
        [
          [43, 1],
          [43, 2],
        ],
        [[43, 3]],
      ],
    });
  });

  it('drops empty days and caps days/readings', () => {
    const longDay: CustomReading[] = Array.from(
      {length: MAX_DAY_READINGS + 10},
      (_, i) => [1, (i % 50) + 1] as CustomReading,
    );
    const b = makeCustomPlanBundle('X', [[], longDay, []]);
    expect(b.d).toHaveLength(1); // both empty days dropped
    expect(b.d[0]).toHaveLength(MAX_DAY_READINGS); // readings capped
  });
});

describe('custom plan round-trip / hardening', () => {
  const sample = makeCustomPlanBundle('Mi plan', [
    [
      [1, 1],
      [1, 2],
    ],
    [[19, 23]],
  ]);

  it('round-trips through the link', () => {
    const res = decodeTogetherParam(param(encodeBundleLink(sample)));
    expect(res).toEqual({ok: true, bundle: sample});
  });

  it('encodeBundleParam matches the link payload', () => {
    expect(decodeTogetherParam(encodeBundleParam(sample))).toEqual({
      ok: true,
      bundle: sample,
    });
  });

  it('re-sanitizes a malicious plan name on decode', () => {
    const evil = 'Z'.repeat(200) + String.fromCharCode(0, 31, 127) + '  x';
    const link = encodeBundleLink({
      v: 1,
      t: 'cplan',
      n: evil,
      d: [[[1, 1]]],
    } as never);
    const res = decodeTogetherParam(param(link));
    expect(res.ok).toBe(true);
    if (res.ok && res.bundle.t === 'cplan') {
      expect(res.bundle.n).toBe('Z'.repeat(PLAN_NAME_MAX));
    }
  });

  it('rejects an empty plan, empty day, or empty name', () => {
    const mk = (d: unknown, n = 'Ok') =>
      decodeTogetherParam(
        param(encodeBundleLink({v: 1, t: 'cplan', n, d} as never)),
      );
    expect(mk([]).ok).toBe(false); // no days
    expect(mk([[]]).ok).toBe(false); // empty day
    expect(mk([[[1, 1]]], '   ').ok).toBe(false); // name sanitizes to empty
  });

  it('rejects malformed or out-of-range readings', () => {
    const mk = (reading: unknown) =>
      decodeTogetherParam(
        param(
          encodeBundleLink({
            v: 1,
            t: 'cplan',
            n: 'Ok',
            d: [[reading]],
          } as never),
        ),
      );
    expect(mk([1]).ok).toBe(false); // not a pair
    expect(mk([0, 1]).ok).toBe(false); // book id < 1
    expect(mk([67, 1]).ok).toBe(false); // book id > 66
    expect(mk([1, 0]).ok).toBe(false); // chapter < 1
    expect(mk([1, 151]).ok).toBe(false); // chapter > 150
    expect(mk([1, 1.5]).ok).toBe(false); // non-integer chapter
    expect(mk('Genesis 1').ok).toBe(false); // not even an array
  });

  it('rejects too many days', () => {
    const tooMany = Array.from(
      {length: MAX_PLAN_DAYS + 1},
      () => [[1, 1]] as CustomReading[],
    );
    const link = encodeBundleLink({
      v: 1,
      t: 'cplan',
      n: 'Ok',
      d: tooMany,
    } as never);
    expect(decodeTogetherParam(param(link)).ok).toBe(false);
  });
});

describe('sanitizePlanName', () => {
  it('strips controls, collapses whitespace, trims, and caps length', () => {
    expect(sanitizePlanName('  a' + TAB + 'b  ')).toBe('a b');
    expect(sanitizePlanName('y'.repeat(200)).length).toBe(PLAN_NAME_MAX);
    expect(sanitizePlanName('a' + CTRL + 'b')).toBe('ab');
  });
});

describe('makeStudyBundle', () => {
  const passage = {bookId: 43, chapter: 3, startVerse: 16, endVerse: 21};

  it('builds a versioned study bundle, drops blank notes, sanitizes title', () => {
    const b = makeStudyBundle(passage, '  Pastor A  ', {
      context: 'Nicodemo de noche.',
      bigIdea: '   ',
      christ: 'El Hijo levantado.',
    });
    expect(b).toEqual({
      v: TOGETHER_BUNDLE_VERSION,
      t: 'study',
      b: 43,
      c: 3,
      sv: 16,
      ev: 21,
      ti: 'Pastor A',
      n: {context: 'Nicodemo de noche.', christ: 'El Hijo levantado.'},
    });
  });

  it('swaps a reversed verse range', () => {
    const b = makeStudyBundle(
      {bookId: 1, chapter: 1, startVerse: 5, endVerse: 1},
      undefined,
      {context: 'x'},
    );
    expect([b.sv, b.ev]).toEqual([1, 5]);
    expect(b.ti).toBeUndefined();
  });
});

describe('study round-trip / hardening', () => {
  const sample = makeStudyBundle(
    {bookId: 43, chapter: 3, startVerse: 16, endVerse: 16},
    'Estudio de Juan',
    {context: 'Línea 1\nLínea 2', application: 'Cree y vive.'},
  );

  it('round-trips through the link, keeping note line breaks', () => {
    const res = decodeTogetherParam(param(encodeBundleLink(sample)));
    expect(res).toEqual({ok: true, bundle: sample});
    if (res.ok && res.bundle.t === 'study') {
      expect(res.bundle.n.context).toContain('\n');
    }
  });

  it('encodeStudyLink targets the study-shared route and round-trips', () => {
    const link = encodeStudyLink(sample);
    expect(link.startsWith('eternalbible://features/study-shared?d=')).toBe(
      true,
    );
    expect(decodeTogetherParam(param(link))).toEqual({
      ok: true,
      bundle: sample,
    });
  });

  it('re-sanitizes a malicious title + notes on decode', () => {
    const link = encodeBundleLink({
      v: 1,
      t: 'study',
      b: 43,
      c: 3,
      sv: 16,
      ev: 16,
      ti: 'T'.repeat(200) + CTRL,
      n: {context: 'ok' + CTRL + '\nkeep', evil: 'a'.repeat(99999)},
    } as never);
    const res = decodeTogetherParam(param(link));
    expect(res.ok).toBe(true);
    if (res.ok && res.bundle.t === 'study') {
      expect(res.bundle.ti).toBe('T'.repeat(STUDY_TITLE_MAX));
      expect(res.bundle.n.context).toBe('ok\nkeep'); // control byte stripped, \n kept
      expect(res.bundle.n.evil.length).toBeLessThanOrEqual(20000);
    }
  });

  it('rejects out-of-range book / chapter / verse', () => {
    const mk = (o: object) =>
      decodeTogetherParam(param(encodeBundleLink(o as never))).ok;
    expect(mk({v: 1, t: 'study', b: 0, c: 3, sv: 1, ev: 1, n: {}})).toBe(false);
    expect(mk({v: 1, t: 'study', b: 67, c: 3, sv: 1, ev: 1, n: {}})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'study', b: 43, c: 0, sv: 1, ev: 1, n: {}})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'study', b: 43, c: 3, sv: 0, ev: 1, n: {}})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'study', b: 43, c: 3, sv: 1, ev: 999, n: {}})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'study', b: 43, c: 3, sv: 1, ev: 1, n: 5})).toBe(false);
  });

  it('caps the number of note entries', () => {
    const many: Record<string, string> = {};
    for (let i = 0; i < STUDY_NOTE_KEYS_MAX + 10; i++) many['k' + i] = 'x';
    const res = decodeTogetherParam(
      param(
        encodeBundleLink({
          v: 1,
          t: 'study',
          b: 1,
          c: 1,
          sv: 1,
          ev: 1,
          n: many,
        } as never),
      ),
    );
    expect(res.ok).toBe(true);
    if (res.ok && res.bundle.t === 'study') {
      expect(Object.keys(res.bundle.n).length).toBeLessThanOrEqual(
        STUDY_NOTE_KEYS_MAX,
      );
    }
  });

  it('accepts a study with no notes (empty outline still shares the passage)', () => {
    const res = decodeTogetherParam(
      param(
        encodeBundleLink({
          v: 1,
          t: 'study',
          b: 1,
          c: 1,
          sv: 1,
          ev: 1,
          n: {},
        } as never),
      ),
    );
    expect(res.ok).toBe(true);
  });
});

describe('sanitizeNote', () => {
  it('keeps newlines, turns tabs to spaces, strips controls, caps', () => {
    expect(sanitizeNote('a\nb' + TAB + 'c')).toBe('a\nb c');
    expect(sanitizeNote('x' + CTRL + 'y')).toBe('xy');
    expect(sanitizeNote('z'.repeat(50), 10)).toHaveLength(10);
  });
});

describe('date helpers', () => {
  it('todayDateISO formats the LOCAL date as YYYY-MM-DD', () => {
    expect(todayDateISO(new Date(2026, 5, 9))).toBe('2026-06-09');
  });

  it('addDaysISO moves a calendar date and crosses month boundaries', () => {
    expect(addDaysISO('2026-06-22', 1)).toBe('2026-06-23');
    expect(addDaysISO('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDaysISO('2026-06-22', -1)).toBe('2026-06-21');
  });
});

describe('makeCalBundle (Sprint 110)', () => {
  it('builds a versioned calendar, keeps notes, sanitizes title', () => {
    const b = makeCalBundle('2026-06-22', '  Adviento  ', [
      {bookId: 43, chapter: 3, verse: 16, note: '  Dios amó al mundo  '},
      {bookId: 19, chapter: 23, verse: 1},
    ]);
    expect(b).toEqual({
      v: TOGETHER_BUNDLE_VERSION,
      t: 'cal',
      s: '2026-06-22',
      ti: 'Adviento',
      d: [{r: [43, 3, 16], n: 'Dios amó al mundo'}, {r: [19, 23, 1]}],
    });
  });

  it('returns null for an invalid date or when no valid day remains', () => {
    expect(
      makeCalBundle('not-a-date', undefined, [
        {bookId: 1, chapter: 1, verse: 1},
      ]),
    ).toBeNull();
    expect(makeCalBundle('2026-06-22', undefined, [])).toBeNull();
    // every day out of range -> nothing valid left
    expect(
      makeCalBundle('2026-06-22', undefined, [
        {bookId: 99, chapter: 1, verse: 1},
      ]),
    ).toBeNull();
  });

  it('drops out-of-range days but keeps the valid ones', () => {
    const b = makeCalBundle('2026-06-22', undefined, [
      {bookId: 67, chapter: 1, verse: 1}, // bad book
      {bookId: 1, chapter: 1, verse: 1}, // good
      {bookId: 1, chapter: 1, verse: 999}, // bad verse
    ]);
    expect(b?.d).toEqual([{r: [1, 1, 1]}]);
  });

  it('caps the number of days', () => {
    const many = Array.from({length: MAX_CAL_DAYS + 25}, () => ({
      bookId: 1,
      chapter: 1,
      verse: 1,
    }));
    const b = makeCalBundle('2026-06-22', undefined, many);
    expect(b?.d.length).toBe(MAX_CAL_DAYS);
  });
});

describe('cal round-trip / hardening (Sprint 110)', () => {
  const sample = makeCalBundle('2026-06-22', 'Una semana en los Salmos', [
    {
      bookId: 19,
      chapter: 23,
      verse: 1,
      note: 'El Señor es mi pastor.\nNada me faltará.',
    },
    {bookId: 43, chapter: 3, verse: 16},
  ])!;

  it('round-trips through the link, keeping note line breaks', () => {
    const res = decodeTogetherParam(param(encodeBundleLink(sample)));
    expect(res).toEqual({ok: true, bundle: sample});
    if (res.ok && res.bundle.t === 'cal') {
      expect(res.bundle.d[0].n).toContain('\n');
    }
  });

  it('encodeCalLink targets the devotional-shared route and round-trips', () => {
    const link = encodeCalLink(sample);
    expect(
      link.startsWith('eternalbible://features/devotional-shared?d='),
    ).toBe(true);
    expect(decodeTogetherParam(param(link))).toEqual({
      ok: true,
      bundle: sample,
    });
  });

  it('is shareable as an https redirector link', () => {
    const link = encodeHttpsLink(sample);
    expect(link.startsWith(ETERNAL_WEB_BASE)).toBe(true);
    const payload = extractSharedLinkPayload(link)!;
    expect(decodeTogetherParam(payload)).toEqual({ok: true, bundle: sample});
  });

  it('re-sanitizes a malicious title + note on decode', () => {
    const link = encodeBundleLink({
      v: 1,
      t: 'cal',
      s: '2026-06-22',
      ti: 'T'.repeat(200) + CTRL,
      d: [{r: [1, 1, 1], n: 'ok' + CTRL + '\nkeep'}],
    } as never);
    const res = decodeTogetherParam(param(link));
    expect(res.ok).toBe(true);
    if (res.ok && res.bundle.t === 'cal') {
      expect(res.bundle.ti).toBe('T'.repeat(CAL_TITLE_MAX));
      expect(res.bundle.d[0].n).toBe('ok\nkeep'); // control byte stripped, \n kept
    }
  });

  it('rejects a bad date, empty days, or out-of-range refs', () => {
    const mk = (o: object) =>
      decodeTogetherParam(param(encodeBundleLink(o as never))).ok;
    expect(mk({v: 1, t: 'cal', s: 'nope', d: [{r: [1, 1, 1]}]})).toBe(false);
    expect(mk({v: 1, t: 'cal', s: '2026-06-22', d: []})).toBe(false);
    expect(mk({v: 1, t: 'cal', s: '2026-06-22', d: [{r: [0, 1, 1]}]})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'cal', s: '2026-06-22', d: [{r: [1, 151, 1]}]})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'cal', s: '2026-06-22', d: [{r: [1, 1, 201]}]})).toBe(
      false,
    );
    expect(mk({v: 1, t: 'cal', s: '2026-06-22', d: [{r: [1, 1]}]})).toBe(false);
    expect(mk({v: 1, t: 'cal', s: '2026-06-22', d: [{note: 'x'}]})).toBe(false);
  });

  it('caps a too-long note on decode', () => {
    const link = encodeBundleLink({
      v: 1,
      t: 'cal',
      s: '2026-06-22',
      d: [{r: [1, 1, 1], n: 'a'.repeat(CAL_NOTE_MAX + 500)}],
    } as never);
    const res = decodeTogetherParam(param(link));
    expect(res.ok).toBe(true);
    if (res.ok && res.bundle.t === 'cal') {
      expect(res.bundle.d[0].n!.length).toBeLessThanOrEqual(CAL_NOTE_MAX);
    }
  });

  it('rejects too many days', () => {
    const tooMany = Array.from({length: MAX_CAL_DAYS + 1}, () => ({
      r: [1, 1, 1],
    }));
    const link = encodeBundleLink({
      v: 1,
      t: 'cal',
      s: '2026-06-22',
      d: tooMany,
    } as never);
    expect(decodeTogetherParam(param(link)).ok).toBe(false);
  });
});
