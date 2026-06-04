# Bible data: bundle strategy & the pre-seeded asset-DB question (Sprint 67)

How the three bundled translations ship today, what a pre-seeded SQLite asset
would change, and — with **measured numbers** — why we are **keeping the current
runtime-JS seed** for now. Read this before the next production build or before
adding a 4th translation.

## How it works today (100% JS, no rebuild)

`src/lib/database/data-loader.ts` seeds three translations into the on-device
SQLite `bible.db` at runtime from bundled JS data files:

| File                    | Verses     | Raw          | gzip         |
| ----------------------- | ---------- | ------------ | ------------ |
| `bible-data-rvr1960.ts` | 31,102     | 8.1 MB       | 1.48 MB      |
| `bible-data-kjv.ts`     | 31,102     | 7.8 MB       | 1.44 MB      |
| `bible-data-web.ts`     | 31,095     | 7.8 MB       | 1.43 MB      |
| **Total**               | **93,299** | **≈23.7 MB** | **≈4.35 MB** |

Each is `import()`-ed lazily and inserted into the `verses` table, guarded by its
own `@bible_data_loaded_*` flag, so the work is one-time + incremental. On a fresh
install the seed takes **~65 s per version (~3 min for all three)**; an existing
install only pays for newly-bundled versions (Sprint 66's WEB seeded additively).

## The pre-seeded asset-DB alternative

Ship a **pre-built `bible.db`** (all three versions) as an Android asset and copy
it into `files/SQLite/bible.db` on first launch instead of seeding from JS,
dropping the three `bible-data-*.ts` files from the JS bundle.

### Measured size comparison

| Payload                                | Raw     | gzip (≈ APK/AAB compression) |
| -------------------------------------- | ------- | ---------------------------- |
| 3× JS data files                       | 23.7 MB | **4.35 MB**                  |
| `bible.db` (3 versions, incl. indexes) | 32.2 MB | **11.8 MB**                  |

**The asset-DB does NOT shrink the download — it grows it.** JSON-ish text
compresses ~5.4× (→ 4.35 MB); the SQLite binary (B-tree pages + indexes)
compresses only ~2.7× (→ 11.8 MB). Caveat: in a release build the JS data is
compiled to **Hermes bytecode** embedded in `index.android.bundle`; bytecode for
large string tables can exceed the source, so the JS path's _true_ APK
contribution sits somewhere between 4.35 MB (gzipped text) and ~24 MB (raw) and
needs a real release-build measurement to pin down. Even at the pessimistic end,
the DB asset's 11.8 MB compressed is in the same ballpark — **size is a wash at
best, a regression at worst.**

### What the asset-DB _would_ win

- **First-launch time**: a ~1 s file copy instead of the ~3 min JS→SQLite seed.
- **Lower JS heap + no seed race** during startup (the Sprint 67 live test hit a
  transient `prepareAsync` init race once; a pre-seeded DB sidesteps the seed
  entirely).

### What it costs

- **A REBUILD.** Needs `expo-asset` + `expo-file-system` to bundle + copy the
  asset on first launch, a build-time script to generate the pre-seeded `bible.db`,
  and a changed seed flow (copy vs JS seed). This leaves the project's default
  100%-JS / no-rebuild lane and requires `assembleDebug`/AAB + Metro `--clear`.
- Maintenance: the generated `.db` becomes a build artifact to regenerate whenever
  a translation changes.

## Decision (Sprint 67)

**Keep the runtime-JS seed.** There is no download-size win to justify a rebuild
— the JS data already gzips to ~4.35 MB, which is not the dominant APK cost.

**Revisit the asset-DB only if** first-launch seed time becomes a real UX problem,
the startup seed race proves recurrent, or a 4th/5th translation pushes the
bundle past an acceptable size. At that point it becomes a dedicated rebuild
sprint (owner-approved), and the win to optimize for is **startup time, not
size**.

### For the next production build

No action required: the JS-seed path is correct and ships today. The three data
files are already in `.prettierignore`; they gzip well, so they are not the
APK's size driver. If a 4th version is added, follow the Sprint 66 pattern
(`bible-data-<id>.ts` + a `loadBibleVersion` call + the version in both lists +
un-gate the Settings "Coming Soon" badge) and re-measure with this table.
