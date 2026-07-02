# Bible data: bundle strategy (current)

How Bible text ships and seeds into the on-device SQLite DB today. Read this
before the next production build or before adding a 4th translation.

## How it works today

`assets/bible-seed.db` is a pre-built SQLite database (RVR1960 + WEB) shipped
as a bundled asset. On first launch, `seedFromBundleIfMissing()`
(`src/lib/database/index.ts`) copies it straight into
`files/SQLite/bible.db` — a fast file copy, no per-verse insert loop.

`src/lib/database/bible-data-rvr1960.ts` and `bible-data-web.ts` (JS arrays,
~8 MB each) are kept as a **fallback seed path** in `data-loader.ts`, used only
if the asset-DB copy didn't already seed a version (guarded by the same
`@bible_data_loaded_*` flags). In the normal install path they are not
executed; they exist so a corrupted/missing asset copy still self-heals from
JS on next launch.

KJV/BSB ship as separate downloadable packs (Settings → Manage Versions), not
part of the base seed.

## Rebuilding `bible-seed.db`

`scripts/rebuild-seed.js` regenerates the asset DB from the two JS data files
(`bible-data-rvr1960.ts`, `bible-data-web.ts`) using `node:sqlite`. Run it
whenever either source file changes, then re-bundle the app so the new
`bible-seed.db` ships.

## Adding a 4th translation to the base seed

1. Add `bible-data-<id>.ts` next to the existing two.
2. Wire a `loadBibleVersion` call + flag in `data-loader.ts` as the fallback path.
3. Re-run `scripts/rebuild-seed.js` to bake it into `bible-seed.db`.
4. Re-measure bundle size — the asset DB is the size driver now, not the JS
   fallback files (their fallback role means they're rarely exercised but
   still ship in the JS bundle; see the "future work" note below).

## Known follow-up (not urgent)

The JS fallback files still compile into the Hermes bundle even though the
asset-DB path is primary — that's real, if secondary, bundle weight. Demoting
them to an on-demand downloadable pack (same pattern as KJV/BSB) would trim
it, but is a deliberate rebuild task, not a drop-in change — tracked as
technical debt, not blocking.
