/**
 * 📤 prepMarkdown — render a "Mesa de preparación" as clean Markdown (Sprint 103).
 *
 * The preparer fills the scaffold on the [[prepTable]] screen; this turns the
 * gathered helps + their own prose into a tidy Markdown outline they can copy
 * into their sermon notes, a document, or an email to a co-teacher. PURE and
 * fully testable (no React / clipboard / I/O) — the screen assembles the already
 * -resolved strings (localized labels, fetched verse text) and calls this.
 *
 * A finished section shows the preparer's words; an unfilled one shows its
 * guiding question instead, so the export is useful whether it is a working
 * draft or a near-complete outline. The pastoral guardrail rides along at the
 * foot so the framing travels with the document.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {PrepSection} from './prepTable';

/** One outline section, already localized and with the preparer's prose. */
export interface PrepMarkdownSection {
  /** Section heading, e.g. "Contexto". */
  label: string;
  /** Guiding question — shown when the preparer hasn't written a note. */
  prompt: string;
  /** The preparer's own prose for this section (optional). */
  note?: string;
  /** Gathered helps as plain bullet strings (cross-refs, themes, notes). */
  helps?: string[];
  /**
   * The stable `PrepSection` id this rendered section came from (Tanda 3).
   * Optional — a caller that only cares about the free Markdown/manuscript
   * export can omit it, same as before. Format-specific renderers (e.g. the
   * PDF's 'handout' format) need to filter/reorder sections by identity
   * rather than by localized `label`, which changes per language and can't
   * be matched reliably.
   */
  id?: PrepSection;
}

export interface PrepMarkdownInput {
  /** Localized passage label, e.g. "Juan 3:16-21". */
  passageLabel: string;
  /** Optional version label shown beside the passage, e.g. "RVR1960". */
  versionLabel?: string;
  /** Optional passage text, rendered as a numbered blockquote. */
  passageText?: {verse: number; text: string}[];
  /** The outline sections in order. */
  sections: PrepMarkdownSection[];
  /** Pastoral guardrail line carried at the foot of the document. */
  guardrail: string;
  /** Optional attribution footer, e.g. "Eternal Bible · Mesa de preparación". */
  generatedWith?: string;
}

/** One passage inside a whole-series export, with its optional schedule. */
export interface PrepSeriesEntryInput {
  /** Localized date label for the heading, e.g. "12 jul 2026" (already formatted). */
  dateLabel?: string;
  /** Short schedule annotation (NOT the sermon prose). */
  note?: string;
  /** The fully-assembled single-passage input for this entry. */
  passage: PrepMarkdownInput;
}

/** A whole preaching series as one export document. */
export interface PrepSeriesMarkdownInput {
  /** The series name, used as the document title. */
  seriesName: string;
  /** The series' passages, in the order to render them. */
  entries: PrepSeriesEntryInput[];
  /** Localized sermon-type label (e.g. "Expositiva"), already resolved. Absent = uncategorized. */
  sermonTypeLabel?: string;
  /** Pastoral guardrail line carried once at the foot of the document. */
  guardrail: string;
  /** Optional attribution footer. */
  generatedWith?: string;
}

/** Collapse runs of blank lines and trim the trailing whitespace. */
function tidy(markdown: string): string {
  return markdown.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/**
 * Render the passage text (numbered blockquote) and the outline sections at
 * the given Markdown heading level. Shared by the single-passage and
 * whole-series builders so the section formatting lives in exactly one place.
 */
function renderPassageBody(
  input: PrepMarkdownInput,
  sectionHeading: '##' | '###',
): string[] {
  const out: string[] = [];

  if (input.passageText && input.passageText.length > 0) {
    for (const line of input.passageText) {
      const text = (line.text ?? '').trim();
      out.push(`> **${line.verse}** ${text}`.trimEnd());
    }
    out.push('');
  }

  for (const section of input.sections) {
    out.push(`${sectionHeading} ${section.label}`, '');

    const note = section.note?.trim();
    if (note) {
      out.push(note, '');
    } else {
      out.push(`_${section.prompt}_`, '');
    }

    const helps = (section.helps ?? []).filter(h => h && h.trim().length > 0);
    if (helps.length > 0) {
      for (const help of helps) {
        out.push(`- ${help.trim()}`);
      }
      out.push('');
    }
  }

  return out;
}

/** The `---` + guardrail + attribution footer shared by both documents. */
function renderMarkdownFooter(input: {
  guardrail: string;
  generatedWith?: string;
}): string[] {
  const out: string[] = ['---', ''];
  if (input.guardrail.trim()) {
    out.push(`_${input.guardrail.trim()}_`, '');
  }
  if (input.generatedWith?.trim()) {
    out.push(input.generatedWith.trim(), '');
  }
  return out;
}

/** Render a preparation table as a Markdown document. */
export function buildPrepMarkdown(input: PrepMarkdownInput): string {
  const out: string[] = [];

  const title = input.versionLabel
    ? `# ${input.passageLabel} (${input.versionLabel})`
    : `# ${input.passageLabel}`;
  out.push(title, '');

  out.push(...renderPassageBody(input, '##'));
  out.push(...renderMarkdownFooter(input));

  return tidy(out.join('\n'));
}

/**
 * Render a whole preaching series as ONE Markdown document: the series name as
 * the title, then each passage as a section (its own date/note, passage text
 * and outline). Reuses `renderPassageBody`, so a passage exports identically
 * whether alone or inside a series — this only re-frames the SAME content the
 * preparer already wrote, generating nothing (Jeremías 23:30-32).
 */
export function buildSeriesMarkdown(input: PrepSeriesMarkdownInput): string {
  const out: string[] = [];
  out.push(`# ${input.seriesName}`, '');

  const typeLabel = input.sermonTypeLabel?.trim();
  if (typeLabel) {
    out.push(`_${typeLabel}_`, '');
  }

  for (const entry of input.entries) {
    const label = entry.passage.versionLabel
      ? `${entry.passage.passageLabel} (${entry.passage.versionLabel})`
      : entry.passage.passageLabel;
    const heading = entry.dateLabel ? `${entry.dateLabel} · ${label}` : label;
    out.push(`## ${heading}`, '');

    const note = entry.note?.trim();
    if (note) {
      out.push(`_${note}_`, '');
    }

    out.push(...renderPassageBody(entry.passage, '###'));
  }

  out.push(...renderMarkdownFooter(input));

  return tidy(out.join('\n'));
}
