# Integration runbook — ELECCIÓN multi-view dictionary entry

Status as of this commit: the **plumbing is in place and green**, seeded with
the **current draft** text (`DOCS/drafts/eleccion-integrated-draft.md`, commit
`da393ad`) as placeholder. That prose is **not signed off** and will change.
This file is the mechanical checklist for swapping in the approved text.

Branch base: this scaffold sits on top of `content/dictionary-eleccion-multiview`
(`da393ad`) — which carries the two `draft(dictionary): eleccion ...` commits and
the `4336bdc` citation-sweep extension.

---

## What already shipped in the scaffold

| File                                              | Change                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `scripts/add-eleccion-entry.js`                   | reusable splicer (new)                                                                                |
| `scripts/eleccion-entry.json`                     | clean committed input, 4 sections (new)                                                               |
| `assets/dictionary-v2-es.json`                    | `eleccion` entry spliced in at sorted position 4/12                                                   |
| `assets/dictionary-v2-multiview-es.json`          | same `eleccion` entry spliced in at 3/4                                                               |
| `src/lib/database/index.ts`                       | `DICT_V2_VERSION` `7` -> `8` (line ~165) + two doc comments                                           |
| `src/lib/database/__tests__/dictionaryV2.test.ts` | counts `11`->`12`, multi-view `3`->`4`, slug lists, a new `Elección (batch 5)` structure test         |
| `src/features/study/dictionary.ts`                | `RELATED_DICTIONARY_SLUGS`: symmetric `eleccion` / `predestinacion` / `salvacion` cluster (line ~249) |

Gate at scaffold time: `type-check` clean, `lint` clean (pre-existing warnings only),
`format:check` clean, dictionary test suites green
(`dictionaryV2.test.ts`, `dictionary.test.ts`, `dictionaryCitationBounds.test.ts`).
The full `npm run test` has **5 unrelated suites that flake on timeout** under full
parallel load (`guidedDevotionNav`, `dictionaryMultiviewScreen`, `AuthContext`,
`wordStudyScreenBookFilter`, `OfferingSheet`) — all pass when run in isolation;
this predates the scaffold.

---

## The JSON entry shape (spec)

Both asset files store the **identical** object. Key order is fixed (matches
Bautismo / Comunión / Milenio):

```
{
  "slug": "eleccion",
  "headwordEs": "ELECCIÓN",
  "glossEs": "<free gloss, shown before the premium gate>",
  "articleEs": null,
  "sourceTier": "v2-doctrinal",
  "treatment": "multi-view",
  "sections": [
    { "position": 1, "labelEs": "<label>", "bodyEs": "<premium body>" },
    ...
  ]
}
```

- `articleEs` is **always `null`** for a multi-view entry (premium content
  lives entirely in `sections[].bodyEs`).
- `sections[].position` is 1-based and contiguous; it is the display order.
- Serializer: `JSON.stringify(entries, null, 2) + "\n"` (2-space indent,
  trailing newline). `assets/` is in `.prettierignore`, so prettier never
  touches these two files — the splicer's output is the only thing that
  keeps them consistent.

### Sort position

Comparator (from `build-dictionary-v2-es.js`):
`entries.sort((a, b) => a.slug.localeCompare(b.slug))`.

`eleccion` sorts:

- `assets/dictionary-v2-es.json`: **after `creacion`, before `espiritu-santo`** (4 of 12)
- `assets/dictionary-v2-multiview-es.json`: **after `comunion`, before `milenio`** (3 of 4)

The splicer re-sorts with this exact comparator on every run, so you never
place the entry by hand.

---

## The `*italic*` vs `_italic_` gotcha

`src/features/study/dictionary.ts` `parseMarkdownSegments` understands only
`**bold**` and single-asterisk italic. It does **not** understand
underscore emphasis.

Prettier's markdown formatter rewrites single-asterisk emphasis to
underscore emphasis, and `lint-staged` runs `prettier --write` on every
`*.md` on commit — so `DOCS/drafts/eleccion-integrated-draft.md` **always**
comes back with underscore emphasis after any edit. This is not a bug to
fix upstream; it is why the conversion step below is structural.

`scripts/add-eleccion-entry.js` does the conversion (`_x_` -> `*x*`) when it
reads the draft (`--from-draft`). The committed `scripts/eleccion-entry.json`
already holds the asterisk form; `assets/` is prettier-ignored so it stays
asterisk there too. **Never** hand-edit italic into the draft `.md` expecting
it to survive — edit `scripts/eleccion-entry.json` (asterisks) or re-run
`--from-draft`.

The splicer fail-loud rejects a leftover `_italic_`-looking span, a stray
backtick, an unbalanced asterisk, `&nbsp;`, or any `[REVISAR` / `[EXCISE` /
`[NOTA DE CONTEXTO` / `[CONFIRMADO` / `[APROBADO` marker.

---

## When the final text is approved — do this

### 1. Update the input

Preferred: edit **`scripts/eleccion-entry.json`** directly — replace each
`glossEs` / `sections[].bodyEs` string with the approved text. Use
`**bold**` and single-asterisk italic (no underscores). Keep `position`
values and the key order.

Alternative: if the approved text lands in
`DOCS/drafts/eleccion-integrated-draft.md` (same `## glossEs` /
`## Sección N — "..." (bodyEs)` structure), run:

```
node scripts/add-eleccion-entry.js --from-draft
```

That regenerates `scripts/eleccion-entry.json` from the `.md` (converting
underscores) **and** splices. Then eyeball the JSON — in particular the
`labelEs` values: the draft's quoted section titles are long; the short
display labels live in `SECTION_LABELS` at the top of the script and are
what get written.

### 2. Re-run the splicer

```
node scripts/add-eleccion-entry.js
git diff --stat
```

Expected: **only** `assets/dictionary-v2-es.json` and
`assets/dictionary-v2-multiview-es.json` changed, and the diff is a clean
localized replacement inside the existing `eleccion` block — no
reformatting, no other entry touched. The splicer is idempotent and
replaces (not appends) an existing `eleccion` entry.

### 3. If the section set changed (count, order, or labels)

Only needed if the approved structure differs from the current 4 sections
`[El debate, Arminiana y wesleyana, Reformada (calvinista), Lo que
confiesan juntas]`.

- **Swap section 2 vs 3** (Reformed-first instead of Arminian-first): swap
  the two `position` integers in `scripts/eleccion-entry.json`, re-run. The
  script's `SECTION_LABELS` are position-keyed, so labels follow.
- **Different labels / count**: edit `SECTION_LABELS` +
  `EXPECTED_POSITIONS` in `scripts/add-eleccion-entry.js`, then update
  `src/lib/database/__tests__/dictionaryV2.test.ts`:
  - line ~447-452 — the `sections.map(s => s.labelEs)` array in the
    `Elección (batch 5) has exactly 4 sections in order` test
  - line ~514-516 — `eleccionSections` `toHaveLength(4)` and the
    `[1, 2, 3, 4]` positions array in the
    `inserts multiview sections for ...` test

### 4. Version

`DICT_V2_VERSION` is already `8` for this entry (`src/lib/database/index.ts`
line ~165). **Only** bump again (8 -> 9) if the placeholder text has
already reached a device under version 8 — i.e. if this branch was released
before the final-text swap. On an unreleased branch, leave it at 8 and just
re-run the splicer; the doc comment above the constant already describes
batch 5.

Nothing else in the runtime needs a change: `seedDictionaryV2IfNeeded`
(`src/lib/database/index.ts` ~line 921) iterates `entries` and inserts
`e.sections ?? []` generically — a version bump alone forces the re-import.

### 5. Tests to re-check

Run:

```
npx jest src/lib/database/__tests__/dictionaryV2.test.ts src/features/study/__tests__/dictionary.test.ts src/features/study/__tests__/dictionaryCitationBounds.test.ts
```

- `dictionaryV2.test.ts` — no count changes needed (still 12 entries / 4
  multi-view) unless section structure changed (see step 3). The
  `Elección (batch 5)` test also asserts
  `eleccion.glossEs` contains `sin arbitrar entre ellas` (line ~455) — if
  the approved gloss drops that phrase, update or remove that line.
- `dictionaryCitationBounds.test.ts` — the full sweep at line ~262 walks
  `sections[].bodyEs` for every multi-view entry (added in `4336bdc`). Any
  Bible citation in the approved text that resolves out of book/chapter/
  verse bounds fails this. It does **not** flag a citation that fails to
  resolve at all (unregistered abbreviation, etc.) — that just ships as
  plain non-tappable text, a content call for review, not a test failure.
  The current placeholder passes clean; every ref including `Heb 6:4-6` and
  `Heb 10:26-29` resolves in-bounds.
- `dictionary.test.ts` — `RELATED_DICTIONARY_SLUGS` guards
  (`symmetric`, `never links to itself`, `every slug ... is a real shipped
entry`, `no duplicate related slugs`). No change needed unless you alter
  the related-slugs cluster.

### 6. Full gate

```
npm run validate
```

Expect the same 5 flaky-timeout suites noted above and nothing else new.
Re-run any flaky suite in isolation to confirm.

### 7. Commit

Single commit, precedent shape (see `04c1fd8`, the Comunión entry):
`assets/dictionary-v2-es.json`, `assets/dictionary-v2-multiview-es.json`,
`scripts/eleccion-entry.json`, and (if touched) `dictionaryV2.test.ts`,
`src/lib/database/index.ts`.

---

## Files & line numbers, at a glance

| Location                                                             | Why you might touch it at final-text time                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `scripts/eleccion-entry.json` (whole file)                           | the approved gloss + 4 section bodies go here                      |
| `scripts/add-eleccion-entry.js` `SECTION_LABELS` (~line 77)          | only if labels / count / order change                              |
| `src/lib/database/index.ts` ~line 165 (`DICT_V2_VERSION = 8`)        | bump to 9 only if placeholder shipped to a device                  |
| `src/lib/database/__tests__/dictionaryV2.test.ts` ~447-455           | section-label array + the `sin arbitrar entre ellas` gloss assert  |
| `src/lib/database/__tests__/dictionaryV2.test.ts` ~514-516           | `eleccionSections` length + positions array                        |
| `src/features/study/dictionary.ts` ~line 249                         | related-slugs cluster (only if you change the "Ver también" links) |
| `src/features/study/__tests__/dictionaryCitationBounds.test.ts` ~262 | nothing to edit — just must stay green on the approved citations   |
