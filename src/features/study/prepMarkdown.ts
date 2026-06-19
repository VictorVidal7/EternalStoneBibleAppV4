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

/** Collapse runs of blank lines and trim the trailing whitespace. */
function tidy(markdown: string): string {
  return markdown.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** Render a preparation table as a Markdown document. */
export function buildPrepMarkdown(input: PrepMarkdownInput): string {
  const out: string[] = [];

  const title = input.versionLabel
    ? `# ${input.passageLabel} (${input.versionLabel})`
    : `# ${input.passageLabel}`;
  out.push(title, '');

  if (input.passageText && input.passageText.length > 0) {
    for (const line of input.passageText) {
      const text = (line.text ?? '').trim();
      out.push(`> **${line.verse}** ${text}`.trimEnd());
    }
    out.push('');
  }

  for (const section of input.sections) {
    out.push(`## ${section.label}`, '');

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

  out.push('---', '');
  if (input.guardrail.trim()) {
    out.push(`_${input.guardrail.trim()}_`, '');
  }
  if (input.generatedWith?.trim()) {
    out.push(input.generatedWith.trim(), '');
  }

  return tidy(out.join('\n'));
}
