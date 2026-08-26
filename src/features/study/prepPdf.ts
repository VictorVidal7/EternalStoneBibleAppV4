/**
 * 🖨️ prepPdf — render a "Mesa de preparación" as a self-contained, styled
 * HTML document ready to become a PDF (T8.4.5, premium export upgrade).
 *
 * Sibling of prepMarkdown.ts: takes the EXACT SAME `PrepMarkdownInput` shape
 * — no new data model — and renders it as HTML instead of Markdown. PURE (no
 * React / RN / IO) so it's fully unit-testable; the screen assembles the
 * already-resolved strings (localized labels, fetched verse text) and calls
 * this, then hands the HTML string to `Print.printToFileAsync({html})`
 * (expo-print) to produce the actual PDF file, and `Sharing.shareAsync` to
 * hand it off.
 *
 * The free Markdown export (buildPrepMarkdown) is untouched and stays free —
 * this is a pure ADDITION: a nicer-looking export format for the SAME
 * content, gated behind an offering. The app still never writes or
 * interprets the sermon (Jeremías 23:30-32) — this only changes the FORMAT
 * of what the preparer already wrote; no new content is generated here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {
  PrepMarkdownInput,
  PrepMarkdownSection,
  PrepSeriesMarkdownInput,
} from './prepMarkdown';
import type {PrepSection} from './prepTable';

/**
 * The export formats a prep document can be rendered as (Tanda 3, pastors/
 * teachers premium track). `'manuscript'` is the pre-existing full document
 * (free-eligible today, unchanged) — the other three are premium-gated,
 * format-only re-renders of the SAME assembled `PrepMarkdownInput`/
 * `PrepSeriesMarkdownInput`; none of them generate new content, only pick a
 * different subset/shape of what's already there (Jeremías 23:30-32).
 *
 *  - 'manuscript': the full document — passage + every section's note/prompt
 *    + gathered helps. Today's `buildPrepHtml`/`buildSeriesHtml` behavior.
 *  - 'outline': a compact skeleton for the pulpit — headings + bullet helps
 *    only, no prose (note/prompt) and no re-quoted passage text (the
 *    preacher already has the Bible open; this is a glance-at-a-glance
 *    scaffold, not a manuscript).
 *  - 'handout': a congregant follow-along sheet — the passage text plus only
 *    the sections a listener benefits from during/after the message (the
 *    big idea, the application, the discussion questions), never the
 *    preacher's raw exegetical process (context/observation/interpretation/
 *    Christ-connection prose, which is process, not takeaway).
 *  - 'discussion': a small-group discussion sheet — the passage text plus a
 *    FIXED, reviewable "O-I-A" (Observación-Interpretación-Aplicación)
 *    scaffold of generic Bible-study-method questions. Deliberately ignores
 *    the preparer's own section notes: this format is pure METHOD/STRUCTURE
 *    the app supplies, never generated theological content.
 */
export type PrepExportFormat =
  'manuscript' | 'outline' | 'handout' | 'discussion';

/**
 * The `PrepSection` ids most useful to hand to a congregation on a follow-
 * along sheet: the ONE dominant thought (bigIdea), how it changes them
 * (application), and what to talk about afterward (questions). Deliberately
 * excludes context/observation/interpretation/christ — that's the
 * preacher's own study process, not the takeaway a listener needs on paper.
 */
const HANDOUT_SECTION_IDS: readonly PrepSection[] = [
  'bigIdea',
  'application',
  'questions',
];

/**
 * The fixed "O-I-A" discussion scaffold rendered by the 'discussion' format —
 * 3 neutral, general-purpose Spanish prompts per stage, reusable across ANY
 * passage. These are pure METHOD, reviewed as a fixed list (not generated per
 * passage): no answers, no passage-specific content, no doctrinal claims —
 * only the kind of question any solid inductive-study guide asks. Exported so
 * tests can assert against the exact, reviewable list.
 */
export const DISCUSSION_GUIDE_STAGES: ReadonlyArray<{
  label: string;
  prompts: readonly string[];
}> = [
  {
    label: 'Observación',
    prompts: [
      '¿Qué dice el texto literalmente? Anota palabras, frases o ideas que se repiten.',
      '¿Quién habla, a quién, y en qué situación o contexto ocurre esto?',
      '¿Qué preguntas te genera el pasaje al leerlo con cuidado?',
    ],
  },
  {
    label: 'Interpretación',
    prompts: [
      '¿Qué significaba este pasaje para sus primeros oyentes o lectores?',
      '¿Cómo ayuda el resto de la Escritura a entender este pasaje?',
      '¿Cuál es la idea central que el pasaje quiere comunicar?',
    ],
  },
  {
    label: 'Aplicación',
    prompts: [
      '¿Qué verdad de este pasaje necesito creer o recordar hoy?',
      '¿Cómo aplica esto a mi vida esta semana, en algo concreto?',
      '¿Con quién puedo compartir o vivir esto en comunidad?',
    ],
  },
];

/**
 * Turn a series name / passage label into a safe PDF filename (WITHOUT the
 * `.pdf` extension) so a shared export is named meaningfully (e.g. "Efesios en
 * 8 semanas", "Juan 3.16-21") instead of expo-print's random UUID. Strips
 * filesystem-illegal characters, collapses whitespace, caps length, and falls
 * back to a generic name if nothing usable remains.
 */
export function pdfFileName(name: string): string {
  const illegal = /[/\\:*?"<>|]+/g;
  const cleaned = (name ?? '')
    .replace(/:/g, '.')
    .replace(illegal, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();
  return cleaned || 'export';
}

/** Escape the five HTML-significant characters so free-text notes/helps can't break the markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The passage text, as a quoted block with bold verse numbers. Empty string when there's no text. */
function renderPassageBlock(
  passageText: PrepMarkdownInput['passageText'],
): string {
  if (!passageText || passageText.length === 0) return '';
  const verses = passageText
    .map(line => {
      const text = escapeHtml((line.text ?? '').trim());
      return `<p class="verse"><span class="verse-num">${line.verse}</span>${text}</p>`;
    })
    .join('\n');
  return `<blockquote class="passage">\n${verses}\n</blockquote>`;
}

/** One outline section as a heading + (note or prompt) + gathered helps. */
function renderSection(section: PrepMarkdownSection): string {
  const note = section.note?.trim();
  const bodyHtml = note
    ? `<p class="note">${escapeHtml(note)}</p>`
    : `<p class="prompt">${escapeHtml(section.prompt)}</p>`;

  const helps = (section.helps ?? []).filter(h => h && h.trim().length > 0);
  const helpsHtml =
    helps.length > 0
      ? `<ul class="helps">\n${helps
          .map(h => `  <li>${escapeHtml(h.trim())}</li>`)
          .join('\n')}\n</ul>`
      : '';

  return [
    '<section class="outline-section">',
    `  <h2>${escapeHtml(section.label)}</h2>`,
    `  ${bodyHtml}`,
    helpsHtml ? `  ${helpsHtml}` : '',
    '</section>',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * One outline section as a heading + gathered helps ONLY — the 'outline'
 * format's compact pulpit skeleton. Drops the note/prompt prose entirely
 * (that's the manuscript's job); reuses the SAME `outline-section`/`helps`
 * markup + CSS as `renderSection` so no new stylesheet rules are needed.
 */
function renderOutlineSkeletonSection(section: PrepMarkdownSection): string {
  const helps = (section.helps ?? []).filter(h => h && h.trim().length > 0);
  const helpsHtml =
    helps.length > 0
      ? `<ul class="helps">\n${helps
          .map(h => `  <li>${escapeHtml(h.trim())}</li>`)
          .join('\n')}\n</ul>`
      : '';

  return [
    '<section class="outline-section">',
    `  <h2>${escapeHtml(section.label)}</h2>`,
    helpsHtml ? `  ${helpsHtml}` : '',
    '</section>',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * The 'handout' format: only the sections in `HANDOUT_SECTION_IDS`, rendered
 * identically to the manuscript (note-or-prompt + helps) — a congregant gets
 * the finished big idea/application/questions, not a partial manuscript.
 * Sections without an `id` (a caller that hasn't adopted the new field yet)
 * never match, so an un-migrated caller simply renders an empty handout
 * body rather than guessing by label.
 */
function renderHandoutSections(sections: PrepMarkdownSection[]): string {
  return sections
    .filter(s => s.id != null && HANDOUT_SECTION_IDS.includes(s.id))
    .map(renderSection)
    .join('\n');
}

/**
 * The 'discussion' format's body: the FIXED O-I-A scaffold, completely
 * independent of the preparer's own section notes (this format never shows
 * the preparer's private prose — only the reusable method questions). Reuses
 * the same `outline-section`/`h2`/`helps` markup so no new CSS is needed.
 */
function renderDiscussionSections(): string {
  return DISCUSSION_GUIDE_STAGES.map(stage => {
    const helpsHtml = `<ul class="helps">\n${stage.prompts
      .map(p => `  <li>${escapeHtml(p)}</li>`)
      .join('\n')}\n</ul>`;
    return [
      '<section class="outline-section">',
      `  <h2>${escapeHtml(stage.label)}</h2>`,
      `  ${helpsHtml}`,
      '</section>',
    ].join('\n');
  }).join('\n');
}

/**
 * Dispatch the outline sections markup by format. `'manuscript'` returns
 * EXACTLY what the original (pre-Tanda-3) code computed — the same
 * `sections.map(renderSection).join('\n')` — so the default/no-format-arg
 * call site sees zero output change.
 */
function renderSectionsForFormat(
  sections: PrepMarkdownSection[],
  format: PrepExportFormat,
): string {
  switch (format) {
    case 'outline':
      return sections.map(renderOutlineSkeletonSection).join('\n');
    case 'handout':
      return renderHandoutSections(sections);
    case 'discussion':
      return renderDiscussionSections();
    case 'manuscript':
    default:
      return sections.map(renderSection).join('\n');
  }
}

/**
 * Whether the passage text blockquote is rendered for a given format. The
 * 'outline' pulpit skeleton omits it (the preacher already has the Bible
 * open — this is a glance-at-a-glance scaffold, not the manuscript); every
 * other format keeps it, since a congregant/small-group sheet needs the
 * actual text to follow along.
 */
function includesPassageText(format: PrepExportFormat): boolean {
  return format !== 'outline';
}

/** The pastoral guardrail + attribution footer, shared by both documents. */
function renderDocFooter(guardrail: string, generatedWith?: string): string {
  const g = guardrail.trim();
  const a = generatedWith?.trim();
  if (!g && !a) return '';
  return [
    '<footer class="doc-footer">',
    g ? `  <p class="guardrail">${escapeHtml(g)}</p>` : '',
    a ? `  <p class="attribution">${escapeHtml(a)}</p>` : '',
    '</footer>',
  ]
    .filter(Boolean)
    .join('\n');
}

/** The inline stylesheet, shared by the single-passage and whole-series docs. */
const DOC_STYLE = `<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1f2933;
    line-height: 1.55;
    padding: 48px 56px;
  }
  header.doc-header {
    border-bottom: 2px solid #2f6f4f;
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #14301f;
  }
  h1 .version {
    font-size: 16px;
    font-weight: 400;
    color: #5b6b63;
  }
  blockquote.passage {
    margin: 0 0 32px 0;
    padding: 16px 22px;
    border-left: 4px solid #2f6f4f;
    background: #f4f8f5;
    font-style: italic;
  }
  blockquote.passage .verse {
    margin: 0 0 8px 0;
  }
  blockquote.passage .verse:last-child {
    margin-bottom: 0;
  }
  .verse-num {
    font-weight: 700;
    font-style: normal;
    color: #2f6f4f;
    margin-right: 8px;
  }
  section.series-entry {
    margin-bottom: 40px;
  }
  section.series-entry + section.series-entry {
    page-break-before: always;
  }
  h2.entry-title {
    font-size: 20px;
    font-weight: 700;
    color: #14301f;
    border: none;
    text-transform: none;
    letter-spacing: 0;
    margin: 0 0 6px 0;
    padding: 0;
  }
  .entry-meta {
    margin: 0 0 14px 0;
    font-size: 12px;
    color: #5b6b63;
  }
  .series-meta {
    margin: 0 0 14px 0;
    font-size: 12px;
    color: #5b6b63;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .entry-date {
    font-weight: 700;
    color: #2f6f4f;
  }
  section.outline-section {
    margin-bottom: 26px;
    page-break-inside: avoid;
  }
  section.outline-section h2 {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #2f6f4f;
    border-bottom: 1px solid #dbe4de;
    padding-bottom: 6px;
    margin: 0 0 10px 0;
  }
  .note {
    white-space: pre-wrap;
    margin: 0 0 8px 0;
  }
  .prompt {
    font-style: italic;
    color: #6b7a72;
    margin: 0 0 8px 0;
  }
  ul.helps {
    margin: 8px 0 0 0;
    padding-left: 20px;
    color: #384942;
  }
  ul.helps li {
    margin-bottom: 4px;
  }
  footer.doc-footer {
    margin-top: 36px;
    padding-top: 16px;
    border-top: 1px solid #dbe4de;
  }
  .guardrail {
    font-style: italic;
    font-size: 12px;
    color: #6b7a72;
    margin: 0;
  }
  .attribution {
    font-size: 11px;
    color: #9aa79f;
    margin: 6px 0 0 0;
  }
</style>`;

/** Wrap a document body in the shared, self-contained HTML shell. */
function renderDocShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
${DOC_STYLE}
</head>
<body>
<main>
${bodyHtml}
</main>
</body>
</html>
`;
}

/**
 * Render a preparation table as a self-contained, print-ready HTML document.
 * `format` defaults to `'manuscript'` — the pre-existing, free-eligible full
 * document — so every existing call site (and the 23 pre-Tanda-3 tests) sees
 * byte-identical output with no `format` argument. The other 3 formats
 * (Tanda 3, premium-gated at the call site, not here) reuse the SAME
 * `DOC_STYLE`/`renderDocShell`/`renderDocFooter`/`renderPassageBlock`
 * primitives, just picking a different subset/shape of the SAME assembled
 * input — nothing here generates new content.
 */
export function buildPrepHtml(
  input: PrepMarkdownInput,
  format: PrepExportFormat = 'manuscript',
): string {
  const titleHtml = input.versionLabel
    ? `${escapeHtml(input.passageLabel)} <span class="version">(${escapeHtml(
        input.versionLabel,
      )})</span>`
    : escapeHtml(input.passageLabel);

  const passageHtml = includesPassageText(format)
    ? renderPassageBlock(input.passageText)
    : '';
  const sectionsHtml = renderSectionsForFormat(input.sections, format);
  const footerHtml = renderDocFooter(input.guardrail, input.generatedWith);

  const bodyHtml = `<header class="doc-header">
<h1>${titleHtml}</h1>
</header>
${passageHtml}
<div class="outline">
${sectionsHtml}
</div>
${footerHtml}`;

  return renderDocShell(input.passageLabel, bodyHtml);
}

/** One series entry: its scheduling meta + passage block + outline sections. */
function renderSeriesEntry(
  entry: PrepSeriesMarkdownInput['entries'][number],
  format: PrepExportFormat,
): string {
  const p = entry.passage;
  const titleHtml = p.versionLabel
    ? `${escapeHtml(p.passageLabel)} <span class="version">(${escapeHtml(
        p.versionLabel,
      )})</span>`
    : escapeHtml(p.passageLabel);

  const meta: string[] = [];
  const dateLabel = entry.dateLabel?.trim();
  const note = entry.note?.trim();
  if (dateLabel) {
    meta.push(`<span class="entry-date">${escapeHtml(dateLabel)}</span>`);
  }
  if (note) {
    meta.push(`<span class="entry-note">${escapeHtml(note)}</span>`);
  }
  const metaHtml =
    meta.length > 0 ? `<p class="entry-meta">${meta.join(' · ')}</p>` : '';

  const passageHtml = includesPassageText(format)
    ? renderPassageBlock(p.passageText)
    : '';
  const sectionsHtml = renderSectionsForFormat(p.sections, format);

  return [
    '<section class="series-entry">',
    `<h2 class="entry-title">${titleHtml}</h2>`,
    metaHtml,
    passageHtml,
    '<div class="outline">',
    sectionsHtml,
    '</div>',
    '</section>',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Render a whole preaching series as ONE self-contained, print-ready HTML
 * document — the series name as the title, then every passage's outline in
 * order (each starting on a new printed page). `format` defaults to
 * `'manuscript'`, matching `buildPrepHtml` — same zero-regression guarantee,
 * same 3 additional formats, applied per entry. Reuses the SAME
 * `renderPassageBlock`/`renderSectionsForFormat` a single passage uses, so
 * nothing here generates content; it only re-frames what the preparer
 * already wrote.
 */
export function buildSeriesHtml(
  input: PrepSeriesMarkdownInput,
  format: PrepExportFormat = 'manuscript',
): string {
  const entriesHtml = input.entries
    .map(entry => renderSeriesEntry(entry, format))
    .join('\n');
  const footerHtml = renderDocFooter(input.guardrail, input.generatedWith);
  const typeLabel = input.sermonTypeLabel?.trim();
  const seriesMetaHtml = typeLabel
    ? `<p class="series-meta">${escapeHtml(typeLabel)}</p>`
    : '';

  const bodyHtml = `<header class="doc-header">
<h1>${escapeHtml(input.seriesName)}</h1>
${seriesMetaHtml}
</header>
${entriesHtml}
${footerHtml}`;

  return renderDocShell(input.seriesName, bodyHtml);
}
