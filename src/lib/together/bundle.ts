/**
 * 🤝 "Juntos sin servidor" — bundle codec (Sprint 107).
 *
 * Two transports, both 100 % offline and self-contained (no backend lookup):
 *
 *  - **Link** — `eternalbible://features/together?d=<base64url(json)>`. Carries
 *    the FULL bundle (incl. an optional group name). Tappable + copyable.
 *  - **Code** — `EB1-<date>-<PLAN>`: a short, human-typeable code for the
 *    curated-plan case (no group name). Stable across plan reordering because
 *    it encodes the plan *id token*, not its position.
 *
 * Everything here is pure (no React/Native imports) so it runs identically in
 * Hermes and in jest. The base64url + UTF-8 codec is hand-rolled to avoid
 * depending on `btoa`/`Buffer`/`TextEncoder`, which are not all guaranteed in
 * Hermes. Decoding treats its input as **untrusted** (it arrives from outside
 * the app): every field is validated and the group name re-sanitized.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  GROUP_NAME_MAX,
  TOGETHER_BUNDLE_VERSION,
  type DecodeFailure,
  type DecodeResult,
  type SharedPlanBundle,
  type TogetherBundle,
} from './types';

/** The deep-link route the import screen lives at. */
export const TOGETHER_LINK_PREFIX = 'eternalbible://features/together';

// ───────────────────────── base64url + UTF-8 (portable) ─────────────────────

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function utf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // High surrogate — combine with the following low surrogate.
      const lo = str.charCodeAt(++i);
      code = 0x10000 + ((code - 0xd800) << 10) + (lo - 0xdc00);
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

function bytesToUtf8(bytes: number[]): string | null {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) {
      out += String.fromCharCode(b);
    } else if (b >= 0xc0 && b < 0xe0) {
      if (i >= bytes.length) return null;
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (b >= 0xe0 && b < 0xf0) {
      if (i + 1 >= bytes.length) return null;
      out += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      );
    } else if (b >= 0xf0 && b < 0xf8) {
      if (i + 2 >= bytes.length) return null;
      const cp =
        ((b & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      const c = cp - 0x10000;
      out += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 0x3ff));
    } else {
      return null; // invalid leading byte
    }
  }
  return out;
}

function base64urlEncode(str: string): string {
  const bytes = utf8Bytes(str);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b1 = has1 ? bytes[i + 1] : 0;
    const b2 = has2 ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    if (has1) out += B64[((b1 & 15) << 2) | (b2 >> 6)];
    if (has2) out += B64[b2 & 63];
  }
  return out;
}

function base64urlDecode(input: string): string | null {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of input) {
    const val = B64.indexOf(ch);
    if (val < 0) return null; // any stray char (incl. padding) is invalid
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytesToUtf8(bytes);
}

// ───────────────────────── calendar-date <-> day count ──────────────────────

const DAY_MS = 86_400_000;
/** Fixed pivot so the code's day count stays small and stable. */
const CODE_EPOCH = Date.UTC(2020, 0, 1);
/** ~164 years past the epoch — guards against absurd/overflowing codes. */
const MAX_DAYS = 60_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date `YYYY-MM-DD` → whole days since the epoch, or null if invalid. */
function dateToDays(s: string): number | null {
  if (!DATE_RE.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  // Reject impossible dates (e.g. 2026-02-31 rolls over).
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  const days = Math.round((t - CODE_EPOCH) / DAY_MS);
  return days < 0 || days > MAX_DAYS ? null : days;
}

/** Whole days since the epoch → calendar date `YYYY-MM-DD`. */
function daysToDate(days: number): string {
  const dt = new Date(CODE_EPOCH + days * DAY_MS);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** Today's LOCAL calendar date as `YYYY-MM-DD` (the user's day, not UTC). */
export function todayDateISO(now: Date = new Date()): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** Add `n` whole days to a calendar date `YYYY-MM-DD` (clamped to valid range). */
export function addDaysISO(s: string, n: number): string {
  const days = dateToDays(s);
  if (days === null) return s;
  const next = Math.min(Math.max(days + n, 0), MAX_DAYS);
  return daysToDate(next);
}

// ───────────────────────── Crockford base32 (for the code) ──────────────────

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // no I, L, O, U

function toBase32(n: number): string {
  if (n <= 0) return '0';
  let out = '';
  let v = n;
  while (v > 0) {
    out = CROCKFORD[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return out;
}

function fromBase32(s: string): number | null {
  if (s.length === 0) return null;
  let n = 0;
  for (let ch of s) {
    // Crockford decode aliases for ambiguous glyphs.
    if (ch === 'I' || ch === 'L') ch = '1';
    else if (ch === 'O') ch = '0';
    else if (ch === 'U') ch = 'V';
    const idx = CROCKFORD.indexOf(ch);
    if (idx < 0) return null;
    n = n * 32 + idx;
    if (n > MAX_DAYS) return null;
  }
  return n;
}

/** Plan id → a stable, typeable token (uppercase alphanumerics only). */
function planToken(planId: string): string {
  return planId.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ───────────────────────────── group name ──────────────────────────────────

/** Plain-text, length-capped group label. Used at BOTH encode and decode. */
export function sanitizeGroupName(raw: string): string {
  return (
    raw
      // Whitespace controls (tab/newline) act as separators -> space.
      .replace(/[\t\n\r\f\v]/g, ' ')
      // eslint-disable-next-line no-control-regex -- strip remaining C0 + DEL
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, GROUP_NAME_MAX)
  );
}

// ───────────────────────────── builders ─────────────────────────────────────

/** Build a validated shared-curated-plan bundle from raw inputs. */
export function makePlanBundle(
  planId: string,
  startDate: string,
  groupName?: string,
): SharedPlanBundle {
  const bundle: SharedPlanBundle = {
    v: TOGETHER_BUNDLE_VERSION,
    t: 'plan',
    p: planId,
    s: startDate,
  };
  const g = groupName ? sanitizeGroupName(groupName) : '';
  if (g) bundle.g = g;
  return bundle;
}

// ───────────────────────────── encode ───────────────────────────────────────

/** Full bundle → tappable deep link (carries everything, incl. group name). */
export function encodeBundleLink(bundle: TogetherBundle): string {
  return `${TOGETHER_LINK_PREFIX}?d=${base64urlEncode(JSON.stringify(bundle))}`;
}

/**
 * Curated plan → short human code `EB1-<date32>-<PLAN>`. Returns null only for
 * an out-of-range date. The group name is NOT carried by a code (use the link).
 */
export function encodePlanCode(
  planId: string,
  startDate: string,
): string | null {
  const days = dateToDays(startDate);
  if (days === null) return null;
  return `EB1-${toBase32(days)}-${planToken(planId)}`;
}

// ───────────────────────────── decode ───────────────────────────────────────

function fail(reason: DecodeFailure): DecodeResult {
  return {ok: false, reason};
}

function validateBundle(raw: unknown): DecodeResult {
  if (typeof raw !== 'object' || raw === null) return fail('format');
  const o = raw as Record<string, unknown>;
  if (typeof o.v !== 'number' || o.v > TOGETHER_BUNDLE_VERSION) {
    return fail('version');
  }
  if (o.t === 'plan') {
    if (typeof o.p !== 'string' || o.p.length === 0 || o.p.length > 40) {
      return fail('format');
    }
    if (typeof o.s !== 'string' || dateToDays(o.s) === null) {
      return fail('format');
    }
    const bundle: SharedPlanBundle = {v: o.v, t: 'plan', p: o.p, s: o.s};
    if (typeof o.g === 'string') {
      const g = sanitizeGroupName(o.g); // re-sanitize untrusted input
      if (g) bundle.g = g;
    }
    return {ok: true, bundle};
  }
  // A structurally-valid object with an unknown/missing type tag: either a
  // newer bundle kind, or garbage. Treat as unsupported, not malformed.
  return fail(typeof o.t === 'string' ? 'unsupported' : 'format');
}

/** Decode the `d=` query value from a together deep link. */
export function decodeTogetherParam(param: string): DecodeResult {
  const json = base64urlDecode(param.trim());
  if (json === null) return fail('format');
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return fail('format');
  }
  return validateBundle(raw);
}

/**
 * Decode a short human code into a shared-plan bundle. `knownPlanIds` is the
 * list of plan ids this build ships (injected to keep this module data-free);
 * the code's plan token must match one of them.
 */
export function decodePlanCode(
  input: string,
  knownPlanIds: readonly string[],
): DecodeResult {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s_]+/g, '-') // treat spaces/underscores as delimiters
    .replace(/[^A-Z0-9-]/g, '');
  const parts = cleaned.split('-').filter(Boolean);
  if (parts.length !== 3 || parts[0] !== 'EB1') return fail('format');
  const days = fromBase32(parts[1]);
  if (days === null) return fail('format');
  const token = parts[2];
  const planId = knownPlanIds.find(id => planToken(id) === token);
  if (!planId) return fail('unknown-plan');
  return {
    ok: true,
    bundle: {
      v: TOGETHER_BUNDLE_VERSION,
      t: 'plan',
      p: planId,
      s: daysToDate(days),
    },
  };
}
