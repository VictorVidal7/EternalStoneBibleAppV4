/**
 * Web/native module surface parity — the gate that would have caught R9-13.
 *
 * Metro resolves a BARE specifier (`@lib/reading/redLetterText`) to the
 * `.web` sibling when bundling for web, and to the plain file otherwise.
 * Neither of this repo's two static gates can see that substitution:
 * `tsc` has no platform awareness (it always type-checks against the native
 * file — the trap already documented in app/_layout.web.tsx:7-11), and jest
 * runs `preset: 'jest-expo'` on the NATIVE platform, so a bare import inside
 * a test also loads the native file. A symbol that exists on the native side
 * and not on the web side therefore type-checks clean, tests green, and
 * throws `X is not a function` in the browser — which the global
 * ErrorBoundary escalates into a blank web app, since there is no per-route
 * boundary. That is exactly how `hasRedLetterData` shipped broken in
 * d753a6e (2026-08-18).
 *
 * The invariant is deliberately ONE-DIRECTIONAL: native ⊆ web.
 *   - A symbol on native but missing on web is a crash, because the bare
 *     specifier that every shared component writes silently becomes the web
 *     file at bundle time.
 *   - The reverse is fine and intentional: a web-only extra
 *     (`loadRedLetterSpans`, `clearWebStorageForLockRecovery`) is only ever
 *     reachable through the EXPLICIT `.web` specifier, which native code
 *     never writes.
 *
 * This reads SOURCE TEXT rather than requiring the modules, and that is the
 * point: half these files are screens whose import graph pulls in native-only
 * dependencies, so a require-based check would need a wall of mocks per pair
 * and would rot. The tradeoff is that it only understands the export forms
 * these files actually use — `export [async] function|const|class|enum|
 * interface|type` and `export default`. Verified at the time of writing that
 * no pair uses `export {x} from` or `export *`; if one starts to, teach the
 * scanner about it rather than deleting the case.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');
const SEARCH_ROOTS = ['src', 'app'];

/**
 * Native exports that are deliberately absent from the web sibling. Each
 * entry needs a reason: this list is the escape hatch, so an undocumented
 * entry is indistinguishable from the bug.
 */
const ALLOWED_NATIVE_ONLY: Readonly<Record<string, readonly string[]>> = {
  // A pure helper exported only so __tests__/heroNudgeRoute.test.ts can
  // reach it; nothing imports it across module boundaries, and the web home
  // screen (index.web.tsx) is a different screen that does not use it. No
  // bare specifier resolves to it at runtime, so there is nothing to crash.
  'app/(tabs)/index.tsx': ['heroNudgeRoute'],
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, out);
    } else if (/\.web\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function repoRelative(absolute: string): string {
  return path.relative(REPO_ROOT, absolute).split(path.sep).join('/');
}

/** Named exports that still exist at runtime — `interface`/`type` are erased. */
function runtimeExports(source: string): Set<string> {
  const found = new Set<string>();
  const re = /^export\s+(?:async\s+)?(function|const|let|class|enum)\s+(\w+)/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) found.add(match[2]);
  return found;
}

function hasDefaultExport(source: string): boolean {
  return /^export\s+default\b/m.test(source);
}

function nativeSiblingOf(webFile: string): string | null {
  const base = webFile.replace(/\.web\.tsx?$/, '');
  for (const ext of ['.ts', '.tsx']) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return null;
}

const webFiles = SEARCH_ROOTS.flatMap(root => walk(path.join(REPO_ROOT, root)));

describe('web/native module surface parity', () => {
  it('finds the .web files to compare (guards against the walker silently matching nothing)', () => {
    // Without this, a broken glob would turn every it.each below into zero
    // cases and the whole suite would pass by describing nothing.
    expect(webFiles.length).toBeGreaterThanOrEqual(14);
  });

  it.each(webFiles.map(f => [repoRelative(f), f]))(
    '%s has a native sibling',
    (_label, webFile) => {
      // A .web file with no plain sibling means any bare specifier pointing
      // at it fails to resolve on native at all.
      expect(nativeSiblingOf(webFile as string)).not.toBeNull();
    },
  );

  it.each(webFiles.map(f => [repoRelative(f), f]))(
    '%s exports everything its native sibling exports',
    (_label, webFile) => {
      const nativeFile = nativeSiblingOf(webFile as string);
      if (!nativeFile) return; // reported by the case above
      const nativeSource = fs.readFileSync(nativeFile, 'utf8');
      const webSource = fs.readFileSync(webFile as string, 'utf8');

      const allowed = new Set(
        ALLOWED_NATIVE_ONLY[repoRelative(nativeFile)] ?? [],
      );
      const webNames = runtimeExports(webSource);
      const missing = [...runtimeExports(nativeSource)]
        .filter(name => !webNames.has(name))
        .filter(name => !allowed.has(name));

      expect(missing).toEqual([]);

      if (hasDefaultExport(nativeSource)) {
        expect(hasDefaultExport(webSource)).toBe(true);
      }
    },
  );

  it('has no stale entries in the native-only allowlist', () => {
    // An allowlist that outlives its reason stops being documentation and
    // starts being a hole.
    for (const [relative, names] of Object.entries(ALLOWED_NATIVE_ONLY)) {
      const absolute = path.join(REPO_ROOT, relative);
      expect(fs.existsSync(absolute)).toBe(true);
      const exported = runtimeExports(fs.readFileSync(absolute, 'utf8'));
      for (const name of names) expect([...exported]).toContain(name);
    }
  });
});
