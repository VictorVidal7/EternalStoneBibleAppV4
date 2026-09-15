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
import {renderHook} from '@testing-library/react-native';
import {
  isMissingProviderError,
  WEB_UNMOUNTED_PROVIDERS,
} from '../src/lib/errors/missingProviderError';

/**
 * Which `<XProvider …>` elements a layout file mounts, read off the file the
 * app really runs. `[\s>]` rather than `>`: app/_layout.tsx writes
 * `<ServicesProvider database={bibleDB}>`, and a pattern anchored on `>` would
 * skip every provider that takes a prop — silently shrinking the set this gate
 * compares against.
 */
function providersMountedIn(layoutFile: string): Set<string> {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'app', layoutFile),
    'utf8',
  );
  return new Set(
    [...source.matchAll(/<([A-Za-z]+Provider)[\s>]/g)].map(m => m[1]),
  );
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

  it('never claims a provider app/_layout.web.tsx actually mounts', () => {
    // Derived, not hand-checked: the day someone mounts one of these for
    // real on web, the detector would start lying about it, and this fails
    // instead. Reads the layout the browser really runs.
    const mounted = providersMountedIn('_layout.web.tsx');
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
    const native = providersMountedIn('_layout.tsx');
    const web = providersMountedIn('_layout.web.tsx');
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
    const native = providersMountedIn('_layout.tsx');
    expect(native.size).toBeGreaterThanOrEqual(18);
    const stale = [...WEB_UNMOUNTED_PROVIDERS].filter(
      name => !native.has(name),
    );
    expect(stale).toEqual([]);
  });

  it('recognizes what the six real unmounted-on-web contexts actually throw', () => {
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
    ];

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
