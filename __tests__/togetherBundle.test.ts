/**
 * Sprint 107 — together bundle codec (link + short code).
 * Round trips, untrusted-input hardening, and code typo-tolerance.
 */

import {TOGETHER_BUNDLE_VERSION, GROUP_NAME_MAX} from '@/lib/together/types';
import {
  TOGETHER_LINK_PREFIX,
  addDaysISO,
  decodePlanCode,
  decodeTogetherParam,
  encodeBundleLink,
  encodeBundleParam,
  encodePlanCode,
  makePlanBundle,
  sanitizeGroupName,
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
    if (res.ok) expect(res.bundle.g).toBe('Célula 🙏 Galilea');
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
    if (res.ok) {
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
    expect(res.ok && res.bundle.p).toBe('bible-year');
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
