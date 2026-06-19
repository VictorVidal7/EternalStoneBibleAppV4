import {
  buildPrepMarkdown,
  type PrepMarkdownInput,
} from '../src/features/study/prepMarkdown';

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

describe('prepMarkdown — render a prep table as Markdown', () => {
  it('renders the title with the version', () => {
    const md = buildPrepMarkdown(base);
    expect(md).toContain('# Juan 3:16 (RVR1960)');
  });

  it('renders the title without a version when absent', () => {
    const md = buildPrepMarkdown({...base, versionLabel: undefined});
    expect(md).toContain('# Juan 3:16\n');
    expect(md).not.toContain('()');
  });

  it('renders the passage text as a numbered blockquote', () => {
    const md = buildPrepMarkdown(base);
    expect(md).toContain('> **16** Porque de tal manera amó Dios al mundo');
  });

  it('shows the prompt for an unfilled section and the note for a filled one', () => {
    const md = buildPrepMarkdown(base);
    // Context has no note → its guiding question is shown in italics.
    expect(md).toContain('_¿Quién escribió y por qué?_');
    // Big idea has a note → the note is shown, not the prompt.
    expect(md).toContain('El amor de Dios da vida eterna en su Hijo.');
    expect(md).not.toContain('_¿Cuál es la idea dominante?_');
  });

  it('renders gathered helps as a bullet list', () => {
    const md = buildPrepMarkdown(base);
    expect(md).toContain('- Sobre este libro: el Evangelio de Juan');
  });

  it('carries the guardrail and attribution at the foot', () => {
    const md = buildPrepMarkdown(base);
    expect(md).toContain('---');
    expect(md).toContain('_Examínalo todo a la luz de la Escritura._');
    expect(md).toContain('Eternal Bible · Mesa de preparación');
  });

  it('drops blank helps and collapses excess blank lines', () => {
    const md = buildPrepMarkdown({
      ...base,
      sections: [
        {label: 'Aplicación', prompt: 'p', helps: ['', '   ', 'real help']},
      ],
    });
    expect(md).toContain('- real help');
    expect(md).not.toMatch(/\n{3,}/);
  });

  it('handles an empty passage and no sections without throwing', () => {
    const md = buildPrepMarkdown({
      passageLabel: 'Salmos 1',
      sections: [],
      guardrail: '',
    });
    expect(md).toContain('# Salmos 1');
    expect(md.endsWith('\n')).toBe(true);
  });
});
