/**
 * T-prep (series scheduling) — pure whole-series export renderers:
 * buildSeriesMarkdown (Markdown) and buildSeriesHtml (print-ready HTML). Both
 * take a fully-assembled PrepSeriesMarkdownInput (the screen/assembler resolves
 * verse text + helps + localized date labels; these builders only format it)
 * and reuse the SAME per-passage rendering the single-passage exports use, so a
 * passage looks identical whether exported alone or inside a series.
 */
import {
  buildSeriesMarkdown,
  type PrepMarkdownInput,
  type PrepSeriesMarkdownInput,
} from '../src/features/study/prepMarkdown';
import {
  buildPrepHtml,
  buildSeriesHtml,
  pdfFileName,
} from '../src/features/study/prepPdf';
import {
  assembleSeriesExportInput,
  assembleSeriesPassageInput,
  type SeriesExportDeps,
} from '../src/features/study/prepSeriesExport';
import type {PrepSeries} from '../src/features/study/prepSeries';

function passage(over: Partial<PrepMarkdownInput> = {}): PrepMarkdownInput {
  return {
    passageLabel: 'Efesios 1:1-14',
    versionLabel: 'RVR1960',
    passageText: [{verse: 1, text: 'Pablo, apóstol de Jesucristo'}],
    sections: [
      {
        label: 'Contexto',
        prompt: '¿Quién escribió y por qué?',
        note: 'Carta de Pablo a los efesios.',
        helps: ['Sobre este libro: Efesios'],
      },
      {label: 'Aplicación', prompt: '¿Cómo lo obedezco esta semana?'},
    ],
    guardrail: 'Examínalo todo a la luz de la Escritura.',
    ...over,
  };
}

function seriesInput(
  over: Partial<PrepSeriesMarkdownInput> = {},
): PrepSeriesMarkdownInput {
  return {
    seriesName: 'Efesios en 8 semanas',
    entries: [
      {
        dateLabel: '12 jul 2026',
        note: 'Bautismos después',
        passage: passage({passageLabel: 'Efesios 1:1-14'}),
      },
      {passage: passage({passageLabel: 'Efesios 2:1-10'})},
    ],
    guardrail: 'Examínalo todo a la luz de la Escritura.',
    generatedWith: 'Eternal Bible · Mesa de preparación',
    ...over,
  };
}

describe('buildSeriesMarkdown', () => {
  it('titles the document with the series name', () => {
    const md = buildSeriesMarkdown(seriesInput());
    expect(md.startsWith('# Efesios en 8 semanas')).toBe(true);
  });

  it('renders each passage as an ## entry, sections demoted to ###', () => {
    const md = buildSeriesMarkdown(seriesInput());
    expect(md).toContain('## 12 jul 2026 · Efesios 1:1-14 (RVR1960)');
    expect(md).toContain('## Efesios 2:1-10 (RVR1960)');
    expect(md).toContain('### Contexto');
    expect(md).toContain('### Aplicación');
    // The single-passage title level (#, one h1) only appears once, the series
    // name — passages are ## so they never collide with it.
    expect((md.match(/^# /gm) ?? []).length).toBe(1);
  });

  it('shows the schedule note in italics and only for the dated entry', () => {
    const md = buildSeriesMarkdown(seriesInput());
    expect(md).toContain('_Bautismos después_');
  });

  it('shows the guiding prompt (italic) for an unfilled section', () => {
    const md = buildSeriesMarkdown(seriesInput());
    expect(md).toContain('_¿Cómo lo obedezco esta semana?_');
  });

  it('carries the guardrail once at the foot', () => {
    const md = buildSeriesMarkdown(seriesInput());
    expect(
      (md.match(/Examínalo todo a la luz de la Escritura\./g) ?? []).length,
    ).toBe(1);
  });

  it('handles an empty series without throwing', () => {
    const md = buildSeriesMarkdown(seriesInput({entries: []}));
    expect(md).toContain('# Efesios en 8 semanas');
    expect(md).toContain('---');
  });
});

describe('buildSeriesHtml', () => {
  it('produces a well-formed document titled with the series name', () => {
    const html = buildSeriesHtml(seriesInput());
    expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<title>Efesios en 8 semanas</title>');
    expect(html).toContain('<h1>Efesios en 8 semanas</h1>');
  });

  it('renders one series-entry section per passage', () => {
    const html = buildSeriesHtml(seriesInput());
    const count = (html.match(/<section class="series-entry">/g) ?? []).length;
    expect(count).toBe(2);
    expect(html).toContain(
      '<h2 class="entry-title">Efesios 1:1-14 <span class="version">(RVR1960)</span></h2>',
    );
  });

  it('shows the date and note meta only for the scheduled entry', () => {
    const html = buildSeriesHtml(seriesInput());
    expect(html).toContain('<span class="entry-date">12 jul 2026</span>');
    expect(html).toContain('<span class="entry-note">Bautismos después</span>');
  });

  it('reuses the single-passage section + helps rendering', () => {
    const html = buildSeriesHtml(seriesInput());
    expect(html).toContain('<section class="outline-section">');
    expect(html).toContain('<ul class="helps">');
    expect(html).toContain(
      '<p class="prompt">¿Cómo lo obedezco esta semana?</p>',
    );
  });

  it('emits the doc footer exactly once for the whole series', () => {
    const html = buildSeriesHtml(seriesInput());
    expect((html.match(/class="doc-footer"/g) ?? []).length).toBe(1);
  });

  it('escapes HTML-significant characters in the schedule note', () => {
    const html = buildSeriesHtml(
      seriesInput({
        entries: [{note: 'Nota con <b>etiqueta</b>', passage: passage()}],
      }),
    );
    expect(html).not.toContain('<b>etiqueta</b>');
    expect(html).toContain('&lt;b&gt;etiqueta&lt;/b&gt;');
  });

  it('handles an empty series without throwing', () => {
    const html = buildSeriesHtml(seriesInput({entries: []}));
    expect(html).toContain('<h1>Efesios en 8 semanas</h1>');
    expect(html.trimStart().startsWith('<!DOCTYPE html>')).toBe(true);
  });
});

// Injected I/O so the assembler runs without SQLite / AsyncStorage. Cross-refs
// are forced empty for determinism; verse text and notes come from the fakes.
const fakeDeps: SeriesExportDeps = {
  getVerse: async (_b, _c, v) => ({text: `Texto ${v}`}),
  getNotes: async () => ({
    sections: {bigIdea: 'La gracia de Dios da vida.'},
    updatedAt: 0,
  }),
  getCrossRefs: () => [],
};

describe('assembleSeriesPassageInput', () => {
  it('assembles a real passage from injected verse text + notes', async () => {
    const input = await assembleSeriesPassageInput('John/3/16-21', {
      version: 'RVR1960',
      deps: fakeDeps,
    });
    expect(input).not.toBeNull();
    expect(input!.passageLabel).toContain('Juan 3:16');
    expect(typeof input!.versionLabel).toBe('string');
    // Verses 16..21 → 6 lines, text from the fake getVerse.
    expect(input!.passageText).toHaveLength(6);
    expect(input!.passageText![0]).toEqual({verse: 16, text: 'Texto 16'});
    // The 7 outline sections; only the injected bigIdea note is filled.
    expect(input!.sections).toHaveLength(7);
    const noted = input!.sections.filter(s => s.note);
    expect(noted).toHaveLength(1);
    expect(noted[0].note).toBe('La gracia de Dios da vida.');
  });

  it('returns null for an unknown book', async () => {
    const input = await assembleSeriesPassageInput('Nonexistent/9/1', {
      version: 'RVR1960',
      deps: fakeDeps,
    });
    expect(input).toBeNull();
  });

  it('returns null for a malformed passageKey', async () => {
    expect(
      await assembleSeriesPassageInput('garbage', {
        version: 'RVR1960',
        deps: fakeDeps,
      }),
    ).toBeNull();
  });
});

// Tanda "plantillas de sermón" — one full round-trip per non-expository
// template: the assembler resolves the SAVED entry's own template (not
// always the 7 expository ids), and the curated cross-ref/theme helps
// attach to THAT template's own "interpretation slot" id.
describe('assembleSeriesPassageInput — per-template round-trip', () => {
  const crossRefDeps = (
    template: 'textual' | 'topical' | 'narrative',
    sections: Record<string, string>,
  ): SeriesExportDeps => ({
    getVerse: async (_b, _c, v) => ({text: `Texto ${v}`}),
    getNotes: async () => ({sections, updatedAt: 0, template}),
    getCrossRefs: (_b, _c, v) => (v === 16 ? ['Romans/5/8'] : []),
  });

  it("'textual' attaches cross-refs to versePoints and carries all 6 of its own sections", async () => {
    const input = await assembleSeriesPassageInput('John/3/16', {
      version: 'RVR1960',
      deps: crossRefDeps('textual', {versePoints: 'Cada cláusula, en orden'}),
    });
    expect(input!.sections.map(s => s.id)).toEqual([
      'context',
      'versePoints',
      'bigIdea',
      'christ',
      'application',
      'questions',
    ]);
    const versePoints = input!.sections.find(s => s.id === 'versePoints')!;
    expect(versePoints.note).toBe('Cada cláusula, en orden');
    expect(versePoints.helps).toEqual(
      expect.arrayContaining([expect.stringContaining('Romanos')]),
    );
    // No other section receives the cross-ref helps.
    const others = input!.sections.filter(s => s.id !== 'versePoints');
    for (const s of others) {
      expect(s.helps ?? []).not.toEqual(
        expect.arrayContaining([expect.stringContaining('Romanos')]),
      );
    }
  });

  it("'topical' attaches cross-refs to topicDevelopment and carries all 6 of its own sections", async () => {
    const input = await assembleSeriesPassageInput('John/3/16', {
      version: 'RVR1960',
      deps: crossRefDeps('topical', {
        topicDevelopment: 'El amor de Dios a través de la Escritura',
      }),
    });
    expect(input!.sections.map(s => s.id)).toEqual([
      'context',
      'topicDevelopment',
      'bigIdea',
      'christ',
      'application',
      'questions',
    ]);
    const dev = input!.sections.find(s => s.id === 'topicDevelopment')!;
    expect(dev.helps).toEqual(
      expect.arrayContaining([expect.stringContaining('Romanos')]),
    );
  });

  it("'narrative' attaches cross-refs to resolution and carries all 8 of its own sections", async () => {
    const input = await assembleSeriesPassageInput('John/3/16', {
      version: 'RVR1960',
      deps: crossRefDeps('narrative', {
        tension: 'La condenación que merecemos',
        resolution: 'El Hijo entregado en amor',
      }),
    });
    expect(input!.sections.map(s => s.id)).toEqual([
      'context',
      'observation',
      'tension',
      'resolution',
      'bigIdea',
      'christ',
      'application',
      'questions',
    ]);
    const resolution = input!.sections.find(s => s.id === 'resolution')!;
    expect(resolution.note).toBe('El Hijo entregado en amor');
    expect(resolution.helps).toEqual(
      expect.arrayContaining([expect.stringContaining('Romanos')]),
    );
  });

  it("survives the 'handout' PDF format for a non-expository template — bigIdea/application/questions are universal", async () => {
    const input = await assembleSeriesPassageInput('John/3/16', {
      version: 'RVR1960',
      deps: crossRefDeps('narrative', {
        tension: 'La condenación que merecemos',
        bigIdea: 'Dios amó tanto que dio a su Hijo',
        application: 'Cree en él hoy',
        questions: '¿Qué te impide creer?',
      }),
    });
    const html = buildPrepHtml(input!, 'handout');
    expect(html).toContain(
      input!.sections.find(s => s.id === 'bigIdea')!.label,
    );
    expect(html).toContain(
      input!.sections.find(s => s.id === 'application')!.label,
    );
    expect(html).toContain(
      input!.sections.find(s => s.id === 'questions')!.label,
    );
    // The narrative-only ids are process, not a congregant takeaway — same
    // discipline the expository handout already follows for context/
    // observation/interpretation.
    expect(html).not.toContain(
      input!.sections.find(s => s.id === 'tension')!.label,
    );
  });
});

describe('assembleSeriesExportInput', () => {
  const series = (over: Partial<PrepSeries> = {}): PrepSeries => ({
    id: 's1',
    name: 'Juan en 2 semanas',
    passageKeys: ['John/3/16-21', 'Bad/9/1'],
    schedule: {'John/3/16-21': {date: '2026-07-12', note: 'Comunión'}},
    createdAt: 0,
    updatedAt: 0,
    ...over,
  });

  it('assembles resolvable passages, skips bad ones, and reports progress', async () => {
    const progress: Array<[number, number]> = [];
    const out = await assembleSeriesExportInput(series(), {
      version: 'RVR1960',
      guardrail: 'Examínalo a la luz de la Escritura.',
      generatedWith: 'Eternal Bible',
      dateLabelFor: d => `fecha:${d}`,
      onProgress: (done, total) => progress.push([done, total]),
      deps: fakeDeps,
    });
    expect(out).not.toBeNull();
    expect(out!.seriesName).toBe('Juan en 2 semanas');
    // "Bad/9/1" is skipped; only the resolvable passage becomes an entry.
    expect(out!.entries).toHaveLength(1);
    expect(out!.entries[0].dateLabel).toBe('fecha:2026-07-12');
    expect(out!.entries[0].note).toBe('Comunión');
    expect(out!.entries[0].passage.passageLabel).toContain('Juan 3:16');
    // Progress fires once per passage, including the skipped one.
    expect(progress).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('returns null for a series with no passages', async () => {
    const out = await assembleSeriesExportInput(
      series({passageKeys: [], schedule: undefined}),
      {version: 'RVR1960', guardrail: 'g', deps: fakeDeps},
    );
    expect(out).toBeNull();
  });

  it('returns null when no passage resolves', async () => {
    const out = await assembleSeriesExportInput(
      series({passageKeys: ['Bad/9/1'], schedule: undefined}),
      {version: 'RVR1960', guardrail: 'g', deps: fakeDeps},
    );
    expect(out).toBeNull();
  });
});

describe('pdfFileName', () => {
  it('turns a passage label into a friendly filename (colon → dot, keeps range)', () => {
    expect(pdfFileName('Juan 3:16-21')).toBe('Juan 3.16-21');
  });

  it('keeps a plain series name intact', () => {
    expect(pdfFileName('Efesios en 8 semanas')).toBe('Efesios en 8 semanas');
  });

  it('strips filesystem-illegal characters', () => {
    expect(pdfFileName('a/b\\c*d?e"f<g>h|i')).toBe('a b c d e f g h i');
  });

  it('collapses whitespace and trims', () => {
    expect(pdfFileName('  Serie   con   espacios  ')).toBe(
      'Serie con espacios',
    );
  });

  it('caps the length at 80 characters', () => {
    expect(pdfFileName('x'.repeat(200))).toHaveLength(80);
  });

  it('falls back to a generic name when nothing usable remains', () => {
    expect(pdfFileName('')).toBe('export');
    expect(pdfFileName('///')).toBe('export');
  });
});
