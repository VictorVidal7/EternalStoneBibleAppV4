/**
 * R9-14 — the detector behind the web "this section is not in the web
 * version" screen.
 *
 * The load-bearing test here is the LAST one: it pulls the real message out
 * of every context whose Provider `app/_layout.web.tsx` deliberately does not
 * mount, by actually calling each hook outside a Provider and catching what
 * comes out. A hand-written list of message strings would rot the day someone
 * rewords one, and the rot would be silent — the route would quietly fall
 * back to the generic "Algo salió mal" screen with the retry button that
 * cannot work. This way, rewording a message fails a test instead.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {renderHook} from '@testing-library/react-native';
import {
  isMissingProviderError,
  WEB_UNMOUNTED_PROVIDERS,
} from '../src/lib/errors/missingProviderError';

/**
 * Which `<XProvider …>` elements a layout file mounts, read off the file the
 * app really runs.
 *
 * R9-80: this was a regex over the raw TEXT, and raw text cannot tell a mounted
 * provider from a MENTIONED one. Probed against this very gate: removing
 * `<AudioPlayerProvider>` from app/_layout.web.tsx while leaving the name
 * inside a JSX comment left the whole file green at 11/11 — the set
 * silently GREW to include a provider the web tree no longer mounts, so
 * `unmountedOnWeb` lost it and nothing demanded it be accounted for. The
 * consequence is the one R9-14 exists to prevent: `useAudioPlayer` throws,
 * `isMissingProviderError` says false, and the user gets the generic "Algo
 * salió mal" with a retry button that re-renders the same route and throws
 * again. The header of the old version was already worried about this set
 * silently shrinking; it grows just as quietly.
 *
 * So this walks the SYNTAX TREE instead, the same way webNativeModuleParity's
 * scanner does after R9-67 — comments and string literals stop existing rather
 * than having to be stripped. `ts.createSourceFile` builds the tree without
 * type-checking, resolving a module, or executing a line.
 *
 * A tag this cannot attribute to a plain identifier (`<Ctx.Provider>`) is
 * reported rather than dropped, for R9-67's reason: a form the scanner cannot
 * read makes the comparison quietly weaker instead of failing.
 */
interface LayoutScan {
  mounted: Set<string>;
  unreadable: string[];
}

/**
 * The scanner itself, over SOURCE TEXT rather than a path.
 *
 * R9-86: this used to be inlined in `scanLayout`, which took a filename - so
 * the one positive case R9-80 has (a provider MENTIONED in a comment) could not
 * call it and hand-rolled its own copy of the walk instead. A test of a COPY of
 * the fix protects nothing: reverting `scanLayout` to the old regex left this
 * file at 13/13 green, that case included, with the real bug still reachable
 * (verified: unmount `<AudioPlayerProvider>` in app/_layout.web.tsx, keep the
 * name in a JSX comment - still 13/13). Its sibling
 * webNativeModuleParity.test.ts already had the right shape,
 * `exportSurface(file, source)` plus a thin `surfaceOf(path)`, and this is that
 * shape.
 *
 * A tag it cannot attribute to a plain identifier (`<Ctx.Provider>`) is
 * reported rather than dropped, for R9-67's reason: a form the scanner cannot
 * read makes the comparison quietly weaker instead of failing.
 */
function scanSource(file: string, source: string): LayoutScan {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );
  const mounted = new Set<string>();
  const unreadable: string[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName;
      if (ts.isIdentifier(tag)) {
        if (tag.text.endsWith('Provider')) mounted.add(tag.text);
      } else if (tag.getText(sourceFile).endsWith('Provider')) {
        unreadable.push(tag.getText(sourceFile));
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return {mounted, unreadable};
}

function scanLayout(absoluteFile: string): LayoutScan {
  return scanSource(absoluteFile, fs.readFileSync(absoluteFile, 'utf8'));
}

const APP_ROOT = path.join(__dirname, '..', 'app');

interface LayoutVariants {
  /** `_layout.tsx` — what metro falls back to on every platform. */
  base?: string;
  /** `_layout.web.tsx` — wins over `base` on web. */
  web?: string;
  /** `_layout.native.tsx` — wins over `base` everywhere BUT web. */
  native?: string;
  /** Any other platform suffix. Reported, never guessed at. */
  unknown: string[];
}

/**
 * Every layout file in the app, FOUND rather than listed, grouped by directory
 * and keyed by the platform suffix metro reads.
 *
 * R9-86, the other half: the scanner only ever opened `app/_layout.tsx` and
 * `app/_layout.web.tsx`. `app/(tabs)/_layout.tsx` and its `.web` sibling exist
 * and were never read, so "the providers this app mounts" was a claim about two
 * of the four files that decide it.
 *
 * R9-92: and then it matched those two names LITERALLY, so a directory holding
 * only `_layout.native.tsx` did not reach this map at all — not as an entry, not
 * as an error. Measured: a probe directory with one `<ProbeOnlyProvider>` in a
 * `.native` layout left this file at 15/15 green while native really did mount
 * it, which puts the provider outside `native`, therefore outside
 * `unmountedOnWeb`, therefore outside anything that requires it to be declared —
 * and that is R9-14/R9-75/R9-80's crash walking back in through a side door.
 * The neighbouring case already failed loudly (`.native` + `.web` with no plain
 * `_layout.tsx` trips the "needs a layout native will render" assertion), so the
 * gate's check was right and simply never reached that row. "A gate that never
 * EXECUTED looks exactly like one that passed" — session 16's lesson, one loop
 * iteration down.
 *
 * Nothing in `app/` uses `.native` today. It is one step from convention: five
 * route files here already carry a `.web` suffix.
 */
function layoutFilesByDirectory(): Map<string, LayoutVariants> {
  const byDirectory = new Map<string, LayoutVariants>();
  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const parsed = entry.name.match(/^_layout(?:\.([a-z]+))?\.(?:[jt]sx?)$/);
      if (!parsed) continue;
      const platform = parsed[1];
      const variants = byDirectory.get(directory) ?? {unknown: []};
      if (platform === undefined) variants.base = full;
      else if (platform === 'web') variants.web = full;
      else if (platform === 'native') variants.native = full;
      // `.ios`, `.android`, or anything else metro may learn: this scanner
      // cannot collapse it into one "native" answer, so it says so rather than
      // dropping the file. Teach the scanner, never the reverse.
      else variants.unknown.push(full);
      byDirectory.set(directory, variants);
    }
  };
  walk(APP_ROOT);
  return byDirectory;
}

/**
 * The providers a whole platform's layout tree mounts, unioned over every
 * layout in it.
 *
 * On web, metro resolves `_layout.web.tsx` where there is one and falls back to
 * `_layout.tsx` where there is not - so a nested layout with no `.web` sibling
 * is part of the WEB tree too, and treating it as native-only would invent a
 * provider that web supposedly does not mount. R9-92: the mirror of that is
 * `_layout.native.tsx`, which wins over the plain file everywhere BUT web.
 */
function providersMountedOn(platform: 'native' | 'web'): Set<string> {
  const mounted = new Set<string>();
  for (const variants of layoutFilesByDirectory().values()) {
    const file =
      platform === 'web'
        ? (variants.web ?? variants.base)
        : (variants.native ?? variants.base);
    if (!file) continue;
    for (const name of scanLayout(file).mounted) mounted.add(name);
  }
  return mounted;
}

/**
 * Providers app/_layout.tsx mounts, app/_layout.web.tsx does not, and that
 * STILL must not appear in WEB_UNMOUNTED_PROVIDERS — each with its reason. An
 * undocumented entry here is indistinguishable from the gap it would hide.
 */
const UNMOUNTED_BUT_NEVER_THROWS: Readonly<Record<string, string>> = {
  // `useServices`'s createContext default is a real object, not `undefined`, so
  // the hook never throws and an entry in WEB_UNMOUNTED_PROVIDERS would be
  // unreachable dead weight. Stated in missingProviderError.ts too.
  ServicesProvider: 'useServices has a real createContext default',
};

describe('isMissingProviderError', () => {
  it('matches the three article shapes the app actually uses', () => {
    // "an AuthProvider", "a CustomPlansProvider", and no article at all
    // (ReadingPlanProgressProvider) — all three exist in the codebase.
    expect(
      isMissingProviderError(
        new Error('useAuth must be used within an AuthProvider'),
      ),
    ).toBe(true);
    expect(
      isMissingProviderError(
        new Error('useCustomPlans must be used within a CustomPlansProvider'),
      ),
    ).toBe(true);
    expect(
      isMissingProviderError(
        new Error(
          'useReadingPlanProgress must be used within ReadingPlanProgressProvider',
        ),
      ),
    ).toBe(true);
  });

  it('matches when the message continues past the Provider name', () => {
    // ReadingProgressContext's message has a second sentence after it; an
    // anchored/exact match would miss it.
    expect(
      isMissingProviderError(
        new Error(
          'useReadingProgress must be used within a ReadingProgressProvider. ' +
            'Wrap the tree in one.',
        ),
      ),
    ).toBe(true);
  });

  it('does not match unrelated errors', () => {
    // The control. Without it, an always-true implementation would pass
    // everything above — and would turn every genuine crash on web into a
    // reassuring "not available here" message.
    expect(isMissingProviderError(new Error('Network request failed'))).toBe(
      false,
    );
    expect(
      isMissingProviderError(new Error('hasRedLetterData is not a function')),
    ).toBe(false);
    expect(
      isMissingProviderError(new Error('Provider must be used within a tree')),
    ).toBe(false);
  });

  it('survives non-Error throwables without blowing up', () => {
    expect(isMissingProviderError(null)).toBe(false);
    expect(isMissingProviderError(undefined)).toBe(false);
    expect(isMissingProviderError('a string')).toBe(false);
    expect(isMissingProviderError({})).toBe(false);
    expect(isMissingProviderError({message: 42})).toBe(false);
    expect(isMissingProviderError({message: 'Network request failed'})).toBe(
      false,
    );
  });

  it('matches on the message even when the value is not an Error instance', () => {
    // Deliberate, not an accident of the implementation: a bundled/minified
    // build or a cross-realm throw can produce something that carries the
    // right message and still fails `instanceof Error`. Keying off the
    // message keeps the honest "not in the web version" screen from silently
    // degrading to the generic one in exactly the environment it serves.
    expect(
      isMissingProviderError({
        message: 'useTogether must be used within a TogetherProvider',
      }),
    ).toBe(true);
  });

  it('does NOT dress up an internal expo-router error as a product decision', () => {
    // R9-68. These are real strings from the installed expo-router, two of
    // which literally end in "This is likely a bug in Expo Router." Matching
    // any `…Provider` message swept them up, so a library bug reached the
    // user as "this section is not in the web version" — an affirmative,
    // wrong explanation — with the retry button removed and only a link out.
    const expoRouterInternals = [
      'useFrameSize must be used within a FrameSizeProvider',
      'useRouterCompositionOptions must be used within a ' +
        'RouterCompositionOptionsProvider. This is likely a bug in Expo Router.',
      'useLinkPreviewContext must be used within a LinkPreviewContextProvider. ' +
        'This is likely a bug in Expo Router.',
    ];
    for (const message of expoRouterInternals) {
      expect([message, isMissingProviderError(new Error(message))]).toEqual([
        message,
        false,
      ]);
    }
  });

  it('does NOT dress up a provider the web tree DOES mount', () => {
    // The other half of R9-68, and the more likely one. Every provider below
    // is mounted in app/_layout.web.tsx, so if one of them ever throws it is
    // a genuine bug in the web tree — the user needs the generic screen with
    // its retry, not a calm "this section lives in the Android app".
    const mountedOnWeb = [
      'useReaderPreferences must be used within a ReaderPreferencesProvider',
      'useBibleVersion must be used within BibleVersionProvider',
      'useToast must be used within a ToastProvider',
      'usePremium must be used within a PremiumProvider',
      'useFavorites must be used within a FavoritesProvider',
      'useMemoryDeck must be used within a MemoryDeckProvider',
      'useOfferingSheet must be used within an OfferingSheetProvider',
      'useAudioPlayer must be used within an AudioPlayerProvider',
    ];
    for (const message of mountedOnWeb) {
      expect([message, isMissingProviderError(new Error(message))]).toEqual([
        message,
        false,
      ]);
    }
  });

  it('reads EVERY layout with no provider tag it cannot attribute', () => {
    // R9-67's discipline applied here: `<SomeContext.Provider>` is a form this
    // scanner cannot map to a provider NAME, and an unreadable mount weakens
    // every comparison below instead of failing one. So it fails here, loudly,
    // the day a layout starts using it. Teach the scanner, never the reverse.
    //
    // R9-86: EVERY layout, not the two at the root.
    const directories = [...layoutFilesByDirectory().entries()];
    // Floor: a walker that found nothing would make the loop below hold
    // vacuously, which is the shape this whole review keeps finding.
    expect(directories.length).toBeGreaterThanOrEqual(2);
    for (const [directory, variants] of directories) {
      // R9-92: a platform suffix this scanner does not model is REPORTED. It
      // cannot be folded into `native` (an `.ios` layout says nothing about
      // Android) and dropping it is how the `.native` blind spot happened.
      expect([directory, variants.unknown]).toEqual([directory, []]);
      // Every layout directory needs a layout the NATIVE tree will render: a
      // `.web` orphan would mean native renders no layout there at all.
      expect([directory, Boolean(variants.base ?? variants.native)]).toEqual([
        directory,
        true,
      ]);
      for (const file of [variants.base, variants.native, variants.web]) {
        if (!file) continue;
        expect([file, scanLayout(file).unreadable]).toEqual([file, []]);
      }
    }
  });

  it('counts a provider that is only MENTIONED as not mounted', () => {
    // The R9-80 control, through the REAL scanner. R9-86: it used to build its
    // own ts.createSourceFile and its own visitor, so it tested a COPY of the
    // fix - reverting scanLayout to the old regex left it green.
    const {mounted, unreadable} = scanSource(
      'probe.tsx',
      'export default function Layout() {\n' +
        '  return (\n' +
        '    <RealProvider>\n' +
        '      {/* <CommentedOutProvider> lives in the native tree only */}\n' +
        '      <Slot />\n' +
        '    </RealProvider>\n' +
        '  );\n' +
        '}\n',
    );
    expect([...mounted]).toEqual(['RealProvider']);
    expect(unreadable).toEqual([]);
  });

  it('reports a tag it cannot attribute instead of dropping it', () => {
    // The only positive case the `unreadable` bucket has: no real layout uses
    // `<Ctx.Provider>`, so the assertion that every layout has none is a
    // handful of comparisons that all come back empty unless this exists.
    const {mounted, unreadable} = scanSource(
      'probe.tsx',
      'export default function Layout() {\n' +
        '  return <ThemeContext.Provider value={null} />;\n' +
        '}\n',
    );
    expect(unreadable).toEqual(['ThemeContext.Provider']);
    expect([...mounted]).toEqual([]);
  });

  it('does not mistake a mention inside a STRING for a mount either', () => {
    const {mounted} = scanSource(
      'probe.tsx',
      "const hint = '<AuthProvider> is native-only';\n" +
        'export default function Layout() {\n' +
        '  return <RealProvider>{hint}</RealProvider>;\n' +
        '}\n',
    );
    expect([...mounted]).toEqual(['RealProvider']);
  });

  it('never claims a provider app/_layout.web.tsx actually mounts', () => {
    // Derived, not hand-checked: the day someone mounts one of these for
    // real on web, the detector would start lying about it, and this fails
    // instead. Reads the layout the browser really runs.
    const mounted = providersMountedOn('web');
    // Control: if the regex ever stops matching, the disjointness below
    // would hold vacuously.
    expect(mounted.size).toBeGreaterThanOrEqual(10);
    const overlap = [...WEB_UNMOUNTED_PROVIDERS].filter(name =>
      mounted.has(name),
    );
    expect(overlap).toEqual([]);
  });

  it('accounts for EVERY provider native mounts and web does not', () => {
    // R9-75 — the missing direction. The test above only proves no entry in the
    // list is mounted on web; nothing proved the list was COMPLETE. So the day
    // someone adds a context to app/_layout.tsx and not to _layout.web.tsx, the
    // hook throws, `isMissingProviderError` returns false, and the route falls
    // through to ErrorBoundary.web.tsx's generic "Algo salió mal" with a retry
    // button that re-renders the same route and throws again — the exact
    // symptom R9-14 existed to remove, silently reintroduced. A hand-enumerated
    // list is the third known blind spot of this repo, and "the list is right
    // today" is a note, not a gate. This is the gate: both layouts are on disk,
    // so the difference between them is derivable, not trusted.
    const native = providersMountedOn('native');
    const web = providersMountedOn('web');
    // Floors, not assertions about the app: a regex that half-broke would make
    // everything below hold vacuously. Bump them deliberately.
    expect(native.size).toBeGreaterThanOrEqual(18);
    expect(web.size).toBeGreaterThanOrEqual(10);
    // And the specific half-break worth pinning: `ServicesProvider` is the one
    // provider here written WITH a prop, so a pattern anchored on `>` drops it
    // and every future prop-taking provider with it — shrinking this set
    // without failing anything.
    expect([...native]).toContain('ServicesProvider');

    const unmountedOnWeb = [...native].filter(name => !web.has(name));
    expect(unmountedOnWeb.length).toBeGreaterThanOrEqual(7);

    const unaccounted = unmountedOnWeb.filter(
      name =>
        !WEB_UNMOUNTED_PROVIDERS.has(name) &&
        !(name in UNMOUNTED_BUT_NEVER_THROWS),
    );
    expect(unaccounted).toEqual([]);
  });

  it('has no entry for a provider the native tree does not mount either', () => {
    // The staleness half. An entry that outlives the context it names stops
    // being documentation and starts being a hole in the "is this claim TRUE"
    // reasoning, exactly like the parity gate's ALLOWED_NATIVE_ONLY.
    const native = providersMountedOn('native');
    expect(native.size).toBeGreaterThanOrEqual(18);
    const stale = [...WEB_UNMOUNTED_PROVIDERS].filter(
      name => !native.has(name),
    );
    expect(stale).toEqual([]);
  });

  it('recognizes what EVERY listed unmounted-on-web context actually throws', () => {
    // Not a list of strings — the hooks themselves, called with no Provider.
    const hooks: ReadonlyArray<[string, () => unknown]> = [
      ['useAuth', () => require('../src/context/AuthContext').useAuth()],
      [
        'useReadingProgress',
        () =>
          require('../src/context/ReadingProgressContext').useReadingProgress(),
      ],
      [
        'useReadingPlanProgress',
        () =>
          require('../src/context/ReadingPlanProgressContext').useReadingPlanProgress(),
      ],
      [
        'useCustomPlans',
        () => require('../src/context/CustomPlansContext').useCustomPlans(),
      ],
      [
        'useTogether',
        () => require('../src/context/TogetherContext').useTogether(),
      ],
      [
        'useDonationSheet',
        () => require('../src/context/DonationSheetContext').useDonationSheet(),
      ],
      [
        // The seventh. The title used to say "six" while
        // WEB_UNMOUNTED_PROVIDERS held seven, so this one entry's message was
        // the only one nothing pinned - in a test whose whole reason for
        // existing is that a hand-written list of message strings rots
        // silently. Unreachable today (every caller uses the
        // `useSyncEngineOptional` variant, which returns undefined instead of
        // throwing), which is why it is in the list rather than in
        // UNMOUNTED_BUT_NEVER_THROWS: the throwing hook exists and is exported.
        'useSyncEngine',
        () => require('../src/context/SyncEngineContext').useSyncEngine(),
      ],
    ];

    // Floor: every entry in the list has to be exercised here, or the "derived,
    // not hand-checked" claim above covers only the ones someone remembered.
    expect(hooks.length).toBe(WEB_UNMOUNTED_PROVIDERS.size);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      for (const [name, useHook] of hooks) {
        let thrown: unknown = null;
        try {
          renderHook(() => useHook());
        } catch (error) {
          thrown = error;
        }
        // Reported as [name, boolean] so a failure names the hook that drifted
        // instead of just saying `false !== true`.
        expect([name, thrown !== null]).toEqual([name, true]);
        expect([name, isMissingProviderError(thrown)]).toEqual([name, true]);
      }
    } finally {
      errorSpy.mockRestore();
    }
  });
});
