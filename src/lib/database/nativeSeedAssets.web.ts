/**
 * Web variant of `nativeSeedAssets.ts` — see that file's header for the full
 * rationale. This file intentionally contains NO `require()` /
 * `Asset.fromModule()` calls, so Metro's web bundler never sees a reference
 * to `bible-seed.db`, `cross-references.db`, or `strongs-defs.db` while
 * resolving the web module graph, and excludes all ~27.5MB of them from the
 * web build entirely — instead of shipping-but-never-using them, which is
 * what happened before this split existed (a runtime `Platform.OS` check
 * alone can't prevent it; see `nativeSeedAssets.ts`).
 *
 * `database/index.ts`'s seed functions call these unconditionally (each
 * wrapped in its own try/catch, gracefully degrading if nothing comes back)
 * because that file is shared across platforms, so these must resolve to
 * *something* on web — `null`, meaning "no bundled asset available", which
 * every caller already treats as a normal, silent no-op. Web's real data
 * path (`data-loader.web.ts`) fetches its own small packs at runtime and
 * never depends on these functions returning non-null.
 */
export async function resolveBibleSeedDbAsset(): Promise<string | null> {
  return null;
}

export async function resolveCrossReferencesDbAsset(): Promise<string | null> {
  return null;
}

export async function resolveStrongsDefsDbAsset(): Promise<string | null> {
  return null;
}
