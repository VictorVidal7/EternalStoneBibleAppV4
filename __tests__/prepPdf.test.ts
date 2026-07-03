import {buildPrepHtml} from '../src/features/study/prepPdf';
import type {PrepMarkdownInput} from '../src/features/study/prepMarkdown';

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
