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
  type CustomReading,
} from '@/lib/together/types';
import {
  TOGETHER_LINK_PREFIX,
  addDaysISO,
  decodePlanCode,
  decodeTogetherParam,
  encodeBundleLink,
  encodeBundleParam,
  encodePlanCode,
  makeCustomPlanBundle,
  makePlanBundle,
  sanitizeGroupName,
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
    const link = encodeBundleLink({v: 1, t: 'study', x: 1} as never);
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
