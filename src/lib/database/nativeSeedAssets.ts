/**
 * Resolves the 3 bundled native-only SQLite seed assets — `bible-seed.db`
 * (21MB, RVR1960 + WEB verses), `cross-references.db` (4.7MB, RUMBO #3's
 * cross-reference web), and `strongs-defs.db` (1.8MB, the Strong's
 * definitions overlay) — to local file URIs via expo-asset.
 *
 * NATIVE variant: this plain `.ts` file is what Metro resolves for every
 * platform that doesn't have a more specific override (iOS, Android, and —
 * absent a build for it — even a hypothetical "generic" bundle). See
 * `nativeSeedAssets.web.ts` for the web override and the full rationale.
 *
 * WHY THIS SPLIT EXISTS (not just a `Platform.OS` check at the call site):
 * Metro resolves every `require()` call STATICALLY at bundle time, purely
 * from the literal argument — it cannot see that a call is guarded by a
 * runtime `Platform.OS !== 'web'` check or wrapped in a try/catch, so those
 * guards do NOT stop the referenced asset from being copied into a web
 * build's output. The only thing that keeps an asset out of a platform's
 * bundle is Metro never encountering a `require()` for it while resolving
 * THAT platform's module graph — which is exactly what platform-suffixed
 * files (`.web.ts` here) give you: the web build's `./nativeSeedAssets`
 * import resolves to the sibling file below, which contains no `require()`
 * at all, so these 3 binary assets (~27.5MB combined) never enter the web
 * module graph in the first place. Same pattern already proven in this repo
 * by `redLetterText.ts` / `redLetterText.web.ts` (Phase 3 web port).
 *
 * `require()` is kept inside each function body (not hoisted to module
 * scope) — CJS `require()` is lazy, so this also keeps these large binaries
 * out of Jest's module graph unless one of these functions is actually
 * invoked by a test.
 */
import {Asset} from 'expo-asset';

/**
 * Local file URI for the bundled pre-seeded `bible.db` (RVR1960 + WEB), or
 * null if resolution failed (e.g. the asset didn't download).
 */
export async function resolveBibleSeedDbAsset(): Promise<string | null> {
  const asset = Asset.fromModule(require('../../../assets/bible-seed.db'));
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri ?? null;
}

/**
 * Local file URI for the bundled cross-reference web (RUMBO #3), or null if
 * resolution failed.
 */
export async function resolveCrossReferencesDbAsset(): Promise<string | null> {
  const asset = Asset.fromModule(
    require('../../../assets/cross-references.db'),
  );
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri ?? null;
}

/**
 * Local file URI for the bundled Strong's-definitions overlay, or null if
 * resolution failed.
 */
export async function resolveStrongsDefsDbAsset(): Promise<string | null> {
  const asset = Asset.fromModule(require('../../../assets/strongs-defs.db'));
  await asset.downloadAsync();
  return asset.localUri ?? asset.uri ?? null;
}
