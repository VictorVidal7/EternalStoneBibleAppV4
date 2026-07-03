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

import type {PrepMarkdownInput, PrepMarkdownSection} from './prepMarkdown';

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

/** Render a preparation table as a self-contained, print-ready HTML document. */
export function buildPrepHtml(input: PrepMarkdownInput): string {
  const titleHtml = input.versionLabel
    ? `${escapeHtml(input.passageLabel)} <span class="version">(${escapeHtml(
        input.versionLabel,
      )})</span>`
    : escapeHtml(input.passageLabel);

  const passageHtml = renderPassageBlock(input.passageText);
  const sectionsHtml = input.sections.map(renderSection).join('\n');
  const guardrail = input.guardrail.trim();
  const generatedWith = input.generatedWith?.trim();

  const footerHtml =
    guardrail || generatedWith
      ? [
          '<footer class="doc-footer">',
          guardrail
            ? `  <p class="guardrail">${escapeHtml(guardrail)}</p>`
            : '',
          generatedWith
            ? `  <p class="attribution">${escapeHtml(generatedWith)}</p>`
            : '',
          '</footer>',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(input.passageLabel)}</title>
<style>
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
</style>
</head>
<body>
<main>
<header class="doc-header">
<h1>${titleHtml}</h1>
</header>
${passageHtml}
<div class="outline">
${sectionsHtml}
</div>
${footerHtml}
</main>
</body>
</html>
`;
}
