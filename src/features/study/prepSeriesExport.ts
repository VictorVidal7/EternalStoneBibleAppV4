/**
 * 📦 prepSeriesExport — assemble a whole "Serie de predicación" into ONE
 * exportable document (T-prep, series scheduling + export).
 *
 * The single-passage screen ([[prepTable]] / app/features/prep/index.tsx) does
 * a rich async assembly in its `load()` — passage verse text, resolved
 * cross-reference text, "Cristo en este pasaje" notes, the book intro, and the
 * preparer's saved notes — then shapes it into a `PrepMarkdownInput`. A whole
 * -series export needs that SAME assembly for every passage in the series.
 *
 * Rather than refactor that live screen (its `load()` is entangled with React
 * state/hooks), this module re-implements the ORCHESTRATION on top of the SAME
 * underlying pure/data helpers (`buildPrepTable`, `getBookIntro`,
 * `christConnections`, `getPrepNotes`, `bibleDB`). The small duplication of
 * query glue buys zero regression risk on the shipped single-passage screen.
 * The DB read, notes read, and cross-ref source are all injectable so this is
 * unit-testable without a real SQLite database.
 *
 * NOTHING here generates content — it only gathers and re-frames what the app
 * already curates and what the preparer already wrote (Jeremías 23:30-32).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {getBookIntro} from '@/constants/book-intros';
import {translations} from '@/i18n/translations';
import {
  christLangForVersion,
  formatChristRefLabel,
  parseChristRef,
  versionAbbrev,
} from './christConnections';
import {
  PREP_MAX_CROSS_REFS_PREMIUM,
  buildPrepTable,
  formatPassageLabel,
  getPrepTemplateSections,
  interpretationSlotFor,
  type PrepSection,
} from './prepTable';
import {getPrepNotes} from './prepNotesStore';
import type {PrepNotes} from './prepNotes';
import type {
  PrepMarkdownInput,
  PrepMarkdownSection,
  PrepSeriesEntryInput,
  PrepSeriesMarkdownInput,
} from './prepMarkdown';
import {
  seriesPassages,
  type PrepSeries,
  type ScheduledPassage,
} from './prepSeries';

/** A minimal verse row — only the text is needed for an export. */
interface VerseRowLike {
  text: string | null;
}

/** Injectable I/O so the assembler is unit-testable without SQLite / AsyncStorage. */
export interface SeriesExportDeps {
  getVerse?: (
    bookId: number,
    chapter: number,
    verse: number,
    version: string,
  ) => Promise<VerseRowLike | null>;
  getNotes?: (passageKey: string) => Promise<PrepNotes>;
  getCrossRefs?: (book: string, chapter: number, verse: number) => string[];
  maxCrossRefs?: number;
}

/** Parse a canonical passageKey ("John/3/16" or "1 Corinthians/13/4-7"). */
function parsePassageKey(key: string): {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
} | null {
  const firstSlash = key.indexOf('/');
  const lastSlash = key.lastIndexOf('/');
  if (firstSlash <= 0 || lastSlash <= firstSlash) return null;
  const book = key.slice(0, firstSlash);
  const chapter = Number(key.slice(firstSlash + 1, lastSlash));
  const range = key.slice(lastSlash + 1);
  const dash = range.indexOf('-');
  const startVerse = Number(dash >= 0 ? range.slice(0, dash) : range);
  const endVerse = Number(dash >= 0 ? range.slice(dash + 1) : range);
  if (
    !book ||
    !Number.isFinite(chapter) ||
    !Number.isFinite(startVerse) ||
    !Number.isFinite(endVerse)
  ) {
    return null;
  }
  return {book, chapter, startVerse, endVerse};
}

/**
 * Assemble ONE passage into a `PrepMarkdownInput` — the series-export analog of
 * the single-passage screen's `load()` + `buildPrepInput()`, kept independent
 * so that screen is never touched. Returns null when the passageKey doesn't
 * resolve to a real passage.
 */
export async function assembleSeriesPassageInput(
  passageKey: string,
  opts: {version: string; deps?: SeriesExportDeps},
): Promise<PrepMarkdownInput | null> {
  const parts = parsePassageKey(passageKey);
  if (!parts) return null;

  const {version} = opts;
  const deps = opts.deps ?? {};
  const getVerse =
    deps.getVerse ??
    ((b: number, c: number, v: number, ver: string) =>
      bibleDB.getVerse(b, c, v, ver));
  const getNotes = deps.getNotes ?? getPrepNotes;
  const lang = christLangForVersion(version);

  const table = buildPrepTable(
    parts.book,
    parts.chapter,
    parts.startVerse,
    parts.endVerse,
    {
      getCrossRefs: deps.getCrossRefs,
      maxCrossRefs: deps.maxCrossRefs ?? PREP_MAX_CROSS_REFS_PREMIUM,
    },
  );
  if (!table) return null;

  const tr = translations[lang];
  const p = tr.prepTable;

  // Passage text (each verse in the range).
  const verseNums: number[] = [];
  for (let v = table.startVerse; v <= table.endVerse; v++) verseNums.push(v);
  const passageText = await Promise.all(
    verseNums.map(async v => {
      try {
        const row = await getVerse(table.bookId, table.chapter, v, version);
        return {verse: v, text: row?.text ?? ''};
      } catch {
        return {verse: v, text: ''};
      }
    }),
  );

  // Cross-reference parallels (resolved to text, like the live screen).
  const crossRows = await Promise.all(
    table.crossRefs.map(async key => {
      const slash = key.indexOf('/');
      const bookName = slash >= 0 ? key.slice(0, slash) : key;
      const [cStr, vStr] = (slash >= 0 ? key.slice(slash + 1) : '').split('/');
      const c = Number(cStr);
      const v = Number(vStr);
      const info = getBookByName(bookName);
      const display = info
        ? lang === 'en'
          ? info.nameEn
          : info.name
        : bookName;
      let text: string | null = null;
      if (info && Number.isFinite(c) && Number.isFinite(v)) {
        try {
          const row = await getVerse(info.id, c, v, version);
          text = row?.text ?? null;
        } catch {
          text = null;
        }
      }
      return {bookDisplay: display, chapter: c, verse: v, text};
    }),
  );

  // "Cristo en este pasaje" notes (curated; speak the version's language).
  const cc = tr.christConnections;
  const christRows = table.christConnections
    .map(conn => {
      const note = (cc.notes as Record<string, string>)[conn.id];
      let pointsTo: string | undefined;
      if (conn.fulfillment) {
        const fp = parseChristRef(conn.fulfillment);
        const fbook = fp ? getBookByName(fp.book) : undefined;
        if (fp && fbook)
          pointsTo = formatChristRefLabel(conn.fulfillment, lang);
      }
      return {note, pointsTo};
    })
    .filter(r => Boolean(r.note));

  const intro = getBookIntro(table.bookId, lang);
  const notes = await getNotes(table.passageKey);

  const themeLabel = (id: string) =>
    (tr.themes.list as Record<string, {name: string}>)[id]?.name ?? id;

  // Tanda "plantillas de sermón" — resolve THIS entry's own template (legacy
  // entries with no `notes.template` fall back to 'expository', matching
  // today's exact 7-section outline), and which of ITS section ids plays
  // "interpretation"'s role (where the cross-ref/theme helps attach).
  const templateSections = getPrepTemplateSections(notes.template);
  const interpSlot = interpretationSlotFor(notes.template);

  const sections: PrepMarkdownSection[] = templateSections.map(
    (section: PrepSection) => {
      let helps: string[] = [];
      if (section === 'context' && intro) {
        helps = [
          `${p.bookIntroTitle} — ${intro.author} · ${intro.date}`,
          intro.context,
        ];
      } else if (section === interpSlot) {
        helps = [
          ...crossRows.map(r =>
            r.text
              ? `${r.bookDisplay} ${r.chapter}:${r.verse} — ${r.text}`
              : `${r.bookDisplay} ${r.chapter}:${r.verse}`,
          ),
          ...(table.themeIds.length > 0
            ? [`${p.themesTitle}: ${table.themeIds.map(themeLabel).join(', ')}`]
            : []),
        ];
      } else if (section === 'christ') {
        helps = christRows.map(r =>
          r.pointsTo ? `${r.note} (→ ${r.pointsTo})` : r.note,
        );
      }
      return {
        id: section,
        label: p.sections[section].label,
        prompt: p.sections[section].prompt,
        note: notes.sections[section],
        helps,
      };
    },
  );

  return {
    passageLabel: formatPassageLabel(table, lang),
    versionLabel: versionAbbrev(version),
    passageText,
    sections,
    guardrail: p.guardrail,
    generatedWith: p.title,
  };
}

/**
 * Assemble a whole series into one `PrepSeriesMarkdownInput`, ready for
 * `buildSeriesMarkdown` / `buildSeriesHtml`. Passages are assembled
 * SEQUENTIALLY (not `Promise.all`) so DB reads stay bounded and `onProgress`
 * can drive a "Generando N/M…" label for what may be a several-second export.
 * An unresolvable passageKey is skipped (never throws). Returns null when the
 * series has no passages, or none of them resolve.
 */
export async function assembleSeriesExportInput(
  series: PrepSeries,
  opts: {
    version: string;
    guardrail: string;
    generatedWith?: string;
    /** Optional localized date formatter, e.g. (d) => "12 jul 2026". */
    dateLabelFor?: (date: string) => string;
    /** Order to export in (defaults to the manual passage order). */
    order?: ScheduledPassage[];
    onProgress?: (done: number, total: number) => void;
    deps?: SeriesExportDeps;
  },
): Promise<PrepSeriesMarkdownInput | null> {
  const order = opts.order ?? seriesPassages(series);
  if (order.length === 0) return null;

  const entries: PrepSeriesEntryInput[] = [];
  let done = 0;
  for (const sp of order) {
    const passage = await assembleSeriesPassageInput(sp.key, {
      version: opts.version,
      deps: opts.deps,
    });
    done += 1;
    opts.onProgress?.(done, order.length);
    if (!passage) continue;
    const dateLabel =
      sp.date && opts.dateLabelFor ? opts.dateLabelFor(sp.date) : sp.date;
    entries.push({dateLabel, note: sp.note, passage});
  }
  if (entries.length === 0) return null;

  return {
    seriesName: series.name,
    entries,
    guardrail: opts.guardrail,
    generatedWith: opts.generatedWith,
  };
}
