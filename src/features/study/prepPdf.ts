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

/** Render a preparation table as a self-contained, print-ready HTML document. */
export function buildPrepHtml(input: PrepMarkdownInput): string {
  const titleHtml = input.versionLabel
    ? `${escapeHtml(input.passageLabel)} <span class="version">(${escapeHtml(
        input.versionLabel,
      )})</span>`
    : escapeHtml(input.passageLabel);

  const passageHtml = renderPassageBlock(input.passageText);
  const sectionsHtml = input.sections.map(renderSection).join('\n');
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

  const passageHtml = renderPassageBlock(p.passageText);
  const sectionsHtml = p.sections.map(renderSection).join('\n');

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
 * order (each starting on a new printed page). Reuses the SAME
 * `renderPassageBlock`/`renderSection` a single passage uses, so nothing here
 * generates content; it only re-frames what the preparer already wrote.
 */
export function buildSeriesHtml(input: PrepSeriesMarkdownInput): string {
  const entriesHtml = input.entries.map(renderSeriesEntry).join('\n');
  const footerHtml = renderDocFooter(input.guardrail, input.generatedWith);

  const bodyHtml = `<header class="doc-header">
<h1>${escapeHtml(input.seriesName)}</h1>
</header>
${entriesHtml}
${footerHtml}`;

  return renderDocShell(input.seriesName, bodyHtml);
}
