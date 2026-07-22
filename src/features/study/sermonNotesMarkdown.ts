/**
 * 📤 sermonNotesMarkdown — render a "Nota de sermón" session as clean
 * Markdown the listener can share or paste anywhere.
 *
 * Mirrors the outer SHAPE of [[prepMarkdown]]'s `buildSeriesMarkdown` (a
 * title, the prose, a footer) but is this feature's own, independent,
 * Markdown-only export — no PDF / multi-format output, which stays an
 * exclusive feature of the premium "Mesa de preparación" prep table (see
 * `prepPdf.ts` / `sharePdf.ts`). There's also no pastoral "never write the
 * sermon" guardrail line here: that framing belongs to the PREPARER'S side;
 * this document is only the LISTENER's own notes, re-framed as-is.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface SermonNoteMarkdownInput {
  title: string;
  /** Optional church/preacher note, e.g. "Iglesia Central — Pr. Juan". */
  source?: string;
  /** Localized date label for the heading, e.g. "22 jul 2026" (already formatted). */
  dateLabel?: string;
  /** The listener's own free-flowing prose. */
  bodyText: string;
  /** Already-localized referenced-verse labels, e.g. "Juan 3:16-21". */
  referencedVerseLabels: string[];
  /** i18n label for the "Versículos referenciados" section heading. */
  referencedVersesLabel: string;
  /** Optional attribution footer, e.g. "Eternal Bible · Notas de sermón". */
  generatedWith?: string;
}

/** Collapse runs of blank lines and trim the trailing whitespace. */
function tidy(markdown: string): string {
  return markdown.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Render one sermon note session as a Markdown document. */
export function buildSermonNoteMarkdown(
  input: SermonNoteMarkdownInput,
): string {
  const out: string[] = [];
  out.push(`# ${input.title}`, '');

  const metaLine = [input.source?.trim(), input.dateLabel?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  if (metaLine) out.push(`_${metaLine}_`, '');

  const body = input.bodyText.trim();
  if (body) out.push(body, '');

  const labels = input.referencedVerseLabels.filter(
    label => label.trim().length > 0,
  );
  if (labels.length > 0) {
    out.push(`## ${input.referencedVersesLabel}`, '');
    for (const label of labels) out.push(`- ${label.trim()}`);
    out.push('');
  }

  out.push('---', '');
  if (input.generatedWith?.trim()) out.push(input.generatedWith.trim(), '');

  return tidy(out.join('\n'));
}
