import {
  buildSermonNoteMarkdown,
  type SermonNoteMarkdownInput,
} from '../src/features/study/sermonNotesMarkdown';

const base: SermonNoteMarkdownInput = {
  title: 'Prédica de hoy',
  source: 'Iglesia Central — Pr. Juan',
  dateLabel: '22 jul 2026',
  bodyText: 'El pastor habló del amor de Dios en Juan 3:16.',
  referencedVerseLabels: ['Juan 3:16'],
  referencedVersesLabel: 'Versículos referenciados',
  generatedWith: 'Eternal Bible · Notas de sermón',
};

describe('sermonNotesMarkdown — render a sermon note session as Markdown', () => {
  it('renders the title as a heading', () => {
    const md = buildSermonNoteMarkdown(base);
    expect(md).toContain('# Prédica de hoy');
  });

  it('renders the source and date as an italic meta line', () => {
    const md = buildSermonNoteMarkdown(base);
    expect(md).toContain('_Iglesia Central — Pr. Juan · 22 jul 2026_');
  });

  it('omits the meta line entirely when neither source nor date is present', () => {
    const md = buildSermonNoteMarkdown({
      ...base,
      source: undefined,
      dateLabel: undefined,
    });
    expect(md).not.toMatch(/^_.*_$/m);
  });

  it('renders only the date when source is absent', () => {
    const md = buildSermonNoteMarkdown({...base, source: undefined});
    expect(md).toContain('_22 jul 2026_');
  });

  it('renders the body prose', () => {
    const md = buildSermonNoteMarkdown(base);
    expect(md).toContain('El pastor habló del amor de Dios en Juan 3:16.');
  });

  it('renders referenced verses as a bullet list under their own heading', () => {
    const md = buildSermonNoteMarkdown(base);
    expect(md).toContain('## Versículos referenciados');
    expect(md).toContain('- Juan 3:16');
  });

  it('omits the referenced-verses section when there are none', () => {
    const md = buildSermonNoteMarkdown({...base, referencedVerseLabels: []});
    expect(md).not.toContain('## Versículos referenciados');
  });

  it('drops blank verse labels', () => {
    const md = buildSermonNoteMarkdown({
      ...base,
      referencedVerseLabels: ['Juan 3:16', '   ', ''],
    });
    const matches = md.match(/^- /gm) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('carries the attribution footer', () => {
    const md = buildSermonNoteMarkdown(base);
    expect(md).toContain('---');
    expect(md).toContain('Eternal Bible · Notas de sermón');
  });

  it('never carries a pastoral guardrail line (listener notes, not sermon prep)', () => {
    const md = buildSermonNoteMarkdown(base);
    expect(md).not.toMatch(/nunca escrib/i);
  });

  it('handles an empty body and no referenced verses without throwing', () => {
    const md = buildSermonNoteMarkdown({
      title: 'Nota vacía',
      bodyText: '',
      referencedVerseLabels: [],
      referencedVersesLabel: 'Versículos referenciados',
    });
    expect(md).toContain('# Nota vacía');
    expect(md).not.toMatch(/\n{3,}/);
  });

  it('collapses excess blank lines', () => {
    const md = buildSermonNoteMarkdown({
      ...base,
      bodyText: 'línea uno\n\n\n\nlínea dos',
    });
    expect(md).not.toMatch(/\n{3,}/);
  });
});
