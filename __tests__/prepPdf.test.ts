import {
  buildPrepHtml,
  buildSeriesHtml,
  DISCUSSION_GUIDE_STAGES,
} from '../src/features/study/prepPdf';
import type {
  PrepMarkdownInput,
  PrepMarkdownSection,
  PrepSeriesMarkdownInput,
} from '../src/features/study/prepMarkdown';
import {PREP_SECTIONS} from '../src/features/study/prepTable';

const base: PrepMarkdownInput = {
  passageLabel: 'Juan 3:16',
  versionLabel: 'RVR1960',
  passageText: [{verse: 16, text: 'Porque de tal manera amó Dios al mundo'}],
  sections: [
    {
      label: 'Contexto',
      prompt: '¿Quién escribió y por qué?',
      helps: ['Sobre este libro: el Evangelio de Juan'],
    },
    {
      label: 'Idea central',
      prompt: '¿Cuál es la idea dominante?',
      note: 'El amor de Dios da vida eterna en su Hijo.',
    },
  ],
  guardrail: 'Examínalo todo a la luz de la Escritura.',
  generatedWith: 'Eternal Bible · Mesa de preparación',
};

describe('prepPdf — render a prep table as a self-contained HTML document', () => {
  it('produces a well-formed HTML document (doctype, html/head/body, matching tags)', () => {
    const html = buildPrepHtml(base);
    expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
    // A <style> block is inlined (self-contained — no external stylesheet).
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
  });

  it('sets the document <title> to the passage label', () => {
    const html = buildPrepHtml(base);
    expect(html).toContain('<title>Juan 3:16</title>');
  });

  it('renders the heading with the version', () => {
    const html = buildPrepHtml(base);
    expect(html).toMatch(
      /<h1>Juan 3:16 <span class="version">\(RVR1960\)<\/span><\/h1>/,
    );
  });

  it('renders the heading without a version span when absent', () => {
    const html = buildPrepHtml({...base, versionLabel: undefined});
    expect(html).toContain('<h1>Juan 3:16</h1>');
    expect(html).not.toContain('class="version"');
  });

  it('renders the passage text as a blockquote with a bold verse number', () => {
    const html = buildPrepHtml(base);
    expect(html).toContain('<blockquote class="passage">');
    expect(html).toContain('<span class="verse-num">16</span>');
    expect(html).toContain('Porque de tal manera amó Dios al mundo');
  });

  it('omits the passage blockquote entirely when there is no passage text', () => {
    const html = buildPrepHtml({...base, passageText: undefined});
    expect(html).not.toContain('class="passage"');
  });

  it('renders one <section> per outline section, with its label as an <h2>', () => {
    const html = buildPrepHtml(base);
    expect(html).toContain('<h2>Contexto</h2>');
    expect(html).toContain('<h2>Idea central</h2>');
    const sectionCount = (
      html.match(/<section class="outline-section">/g) ?? []
    ).length;
    expect(sectionCount).toBe(2);
  });

  it('shows the prompt (italic) for an unfilled section and the note for a filled one', () => {
    const html = buildPrepHtml(base);
    expect(html).toContain('<p class="prompt">¿Quién escribió y por qué?</p>');
    expect(html).toContain(
      '<p class="note">El amor de Dios da vida eterna en su Hijo.</p>',
    );
    expect(html).not.toContain(
      '<p class="prompt">¿Cuál es la idea dominante?</p>',
    );
  });

  it('renders gathered helps as list items', () => {
    const html = buildPrepHtml(base);
    expect(html).toContain('<ul class="helps">');
    expect(html).toContain('<li>Sobre este libro: el Evangelio de Juan</li>');
  });

  it('omits the helps list entirely for a section with no helps', () => {
    const html = buildPrepHtml(base);
    // "Idea central" has no `helps` field at all.
    const ideaSectionMatch = html.match(
      /<h2>Idea central<\/h2>[\s\S]*?<\/section>/,
    );
    expect(ideaSectionMatch).toBeTruthy();
    expect(ideaSectionMatch?.[0]).not.toContain('<ul class="helps">');
  });

  it('drops blank helps', () => {
    const html = buildPrepHtml({
      ...base,
      sections: [
        {label: 'Aplicación', prompt: 'p', helps: ['', '   ', 'real help']},
      ],
    });
    expect(html).toContain('<li>real help</li>');
    expect(html).not.toContain('<li></li>');
  });

  it('carries the guardrail (italic) and attribution in the footer', () => {
    const html = buildPrepHtml(base);
    expect(html).toContain('<footer class="doc-footer">');
    expect(html).toContain(
      '<p class="guardrail">Examínalo todo a la luz de la Escritura.</p>',
    );
    expect(html).toContain(
      '<p class="attribution">Eternal Bible · Mesa de preparación</p>',
    );
  });

  it('omits the footer entirely when there is no guardrail or attribution', () => {
    const html = buildPrepHtml({
      ...base,
      guardrail: '',
      generatedWith: undefined,
    });
    expect(html).not.toContain('class="doc-footer"');
  });

  it('handles an empty passage and no sections without throwing', () => {
    const html = buildPrepHtml({
      passageLabel: 'Salmos 1',
      sections: [],
      guardrail: '',
    });
    expect(html).toContain('<title>Salmos 1</title>');
    expect(html).toContain('<h1>Salmos 1</h1>');
    expect(html).toContain('<div class="outline">');
    expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('escapes HTML-significant characters in free-text notes and helps', () => {
    const html = buildPrepHtml({
      ...base,
      passageLabel: 'Juan 3:16 <script>',
      sections: [
        {
          label: 'Aplicación',
          prompt: 'p',
          note: 'Nota con <b>etiquetas</b> & "comillas"',
          helps: ["Ayuda con <tag> & 'comillas simples'"],
        },
      ],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<b>etiquetas</b>');
    expect(html).toContain('&lt;b&gt;etiquetas&lt;/b&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;comillas&quot;');
    expect(html).toContain('&lt;tag&gt;');
    expect(html).toContain('&#39;comillas simples&#39;');
  });
});

// Tanda 3 — a fully-sectioned fixture (all 7 PREP_SECTIONS, each with an
// `id`, a note AND a prompt AND a help) so the format-aware renderers'
// filtering/omission behavior is actually exercised, not just "produces
// valid HTML".
function sectionedInput(
  over: Partial<PrepMarkdownInput> = {},
): PrepMarkdownInput {
  const sections: PrepMarkdownSection[] = PREP_SECTIONS.map(id => ({
    id,
    label: `Label-${id}`,
    prompt: `Prompt-${id}`,
    note: `Note-${id}`,
    helps: [`Help-${id}`],
  }));
  return {
    passageLabel: 'Efesios 2:1-10',
    passageText: [{verse: 1, text: 'Y él os dio vida juntamente con Cristo'}],
    sections,
    guardrail: 'Examínalo todo a la luz de la Escritura.',
    ...over,
  };
}

describe('buildPrepHtml — format-aware (Tanda 3)', () => {
  it('defaults to the manuscript format (zero-regression guard)', () => {
    const input = sectionedInput();
    expect(buildPrepHtml(input)).toBe(buildPrepHtml(input, 'manuscript'));
  });

  it('manuscript renders every section with its note and helps', () => {
    const html = buildPrepHtml(sectionedInput(), 'manuscript');
    for (const id of PREP_SECTIONS) {
      expect(html).toContain(`Label-${id}`);
      expect(html).toContain(`Note-${id}`);
      expect(html).toContain(`Help-${id}`);
    }
  });

  it('outline: headings + helps only, no note/prompt prose, no passage text', () => {
    const html = buildPrepHtml(sectionedInput(), 'outline');
    for (const id of PREP_SECTIONS) {
      expect(html).toContain(`Label-${id}`);
      expect(html).toContain(`Help-${id}`);
      expect(html).not.toContain(`Note-${id}`);
      expect(html).not.toContain(`Prompt-${id}`);
    }
    expect(html).not.toContain('class="passage"');
    expect(html).not.toContain('Y él os dio vida juntamente con Cristo');
  });

  it('handout: only bigIdea/application/questions, full note + helps, passage text kept', () => {
    const html = buildPrepHtml(sectionedInput(), 'handout');
    for (const id of ['bigIdea', 'application', 'questions'] as const) {
      expect(html).toContain(`Label-${id}`);
      expect(html).toContain(`Note-${id}`);
      expect(html).toContain(`Help-${id}`);
    }
    for (const id of [
      'context',
      'observation',
      'interpretation',
      'christ',
    ] as const) {
      expect(html).not.toContain(`Label-${id}`);
      expect(html).not.toContain(`Note-${id}`);
    }
    expect(html).toContain('class="passage"');
    expect(html).toContain('Y él os dio vida juntamente con Cristo');
  });

  it('handout renders an empty outline body for sections with no `id` (un-migrated caller)', () => {
    const html = buildPrepHtml(base, 'handout');
    expect(html).not.toContain('<section class="outline-section">');
    // The doc shell/passage/footer still render fine — nothing throws.
    expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('discussion: the fixed 9 O-I-A prompts render, section notes do not, passage text is kept', () => {
    const html = buildPrepHtml(sectionedInput(), 'discussion');
    expect(DISCUSSION_GUIDE_STAGES).toHaveLength(3);
    for (const stage of DISCUSSION_GUIDE_STAGES) {
      expect(stage.prompts).toHaveLength(3);
      expect(html).toContain(stage.label);
      for (const prompt of stage.prompts) {
        expect(html).toContain(prompt);
      }
    }
    for (const id of PREP_SECTIONS) {
      expect(html).not.toContain(`Note-${id}`);
    }
    expect(html).toContain('class="passage"');
    expect(html).toContain('Y él os dio vida juntamente con Cristo');
  });
});

function seriesInputWithSections(
  over: Partial<PrepSeriesMarkdownInput> = {},
): PrepSeriesMarkdownInput {
  return {
    seriesName: 'Efesios en 8 semanas',
    entries: [
      {dateLabel: '12 jul 2026', passage: sectionedInput()},
      {passage: sectionedInput({passageLabel: 'Efesios 3:1-13'})},
    ],
    guardrail: 'Examínalo todo a la luz de la Escritura.',
    ...over,
  };
}

describe('buildSeriesHtml — format-aware (Tanda 3)', () => {
  it('defaults to the manuscript format (zero-regression guard)', () => {
    const input = seriesInputWithSections();
    expect(buildSeriesHtml(input)).toBe(buildSeriesHtml(input, 'manuscript'));
  });

  it('outline: applies per entry — no notes/prompts anywhere, helps kept, no passage text', () => {
    const html = buildSeriesHtml(seriesInputWithSections(), 'outline');
    expect(html).not.toContain('Note-bigIdea');
    expect(html).not.toContain('Prompt-bigIdea');
    expect(html).toContain('Help-bigIdea');
    expect(html).not.toContain('class="passage"');
  });

  it('handout: only bigIdea/application/questions per entry (2 entries → 2 occurrences each)', () => {
    const html = buildSeriesHtml(seriesInputWithSections(), 'handout');
    expect((html.match(/Label-bigIdea/g) ?? []).length).toBe(2);
    expect((html.match(/Label-context/g) ?? []).length).toBe(0);
    expect(html).toContain('class="passage"');
  });

  it('discussion: the fixed O-I-A scaffold renders once per entry (2 entries → 2 occurrences)', () => {
    const html = buildSeriesHtml(seriesInputWithSections(), 'discussion');
    const stage = DISCUSSION_GUIDE_STAGES[0];
    // split/join count instead of a regex — the prompts contain "¿"/"?",
    // which are regex metacharacters, not literal text to match.
    const occurrences = (haystack: string, needle: string) =>
      haystack.split(needle).length - 1;
    expect(occurrences(html, stage.label)).toBe(2);
    expect(occurrences(html, stage.prompts[0])).toBe(2);
    expect(html).not.toContain('Note-bigIdea');
  });
});
