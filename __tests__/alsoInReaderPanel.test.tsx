/**
 * Sprint 78 — AlsoInVersionsPanel: "Ver también en…" in the reader's
 * selection bar.
 *
 * Pins the panel contract (the S77 card idiom transplanted to the reader):
 * chips render per alternate version, tapping one lazily loads + quotes the
 * verse in that translation (cached per version), a missing verse shows the
 * honest unavailable copy, the compare exit and the close button fire their
 * callbacks, and a verseKey change resets the open peek.
 */
import {render, fireEvent, act} from '@testing-library/react-native';
import {AlsoInVersionsPanel} from '../src/components/reading/AlsoInVersionsPanel';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const KJV = {
  id: 'KJV',
  name: 'King James Version',
  abbreviation: 'KJV',
  language: 'en',
};
const WEB = {
  id: 'WEB',
  name: 'World English Bible',
  abbreviation: 'WEB',
  language: 'en',
};

const colors = {
  text: '#ffffff',
  textSecondary: '#9ca3af',
  primary: '#6366f1',
  border: '#374151',
};

const baseProps = {
  verseReference: 'Juan 3:16',
  verseKey: '43:3:16',
  alternates: [KJV, WEB],
  colors,
  onCompare: jest.fn(),
  onClose: jest.fn(),
};

const flush = () => act(async () => {});

describe('AlsoInVersionsPanel', () => {
  it('renders one chip per alternate version plus the verse caption', () => {
    const {getByText} = render(
      <AlsoInVersionsPanel
        {...baseProps}
        loadVerseText={jest.fn(async () => null)}
      />,
    );
    expect(getByText('EN · KJV')).toBeTruthy();
    expect(getByText('EN · WEB')).toBeTruthy();
    expect(getByText(/Juan 3:16/)).toBeTruthy();
  });

  it('loads + quotes the verse when a chip opens, caching per version', async () => {
    const loadVerseText = jest.fn(async () => 'For God so loved the world…');
    const {getByText, queryByText} = render(
      <AlsoInVersionsPanel {...baseProps} loadVerseText={loadVerseText} />,
    );
    fireEvent.press(getByText('EN · KJV'));
    await flush();
    expect(getByText('"For God so loved the world…"')).toBeTruthy();
    expect(loadVerseText).toHaveBeenCalledWith('KJV');

    // Collapse + reopen: served from the cache, no second fetch.
    fireEvent.press(getByText('EN · KJV'));
    expect(queryByText('"For God so loved the world…"')).toBeNull();
    fireEvent.press(getByText('EN · KJV'));
    await flush();
    expect(getByText('"For God so loved the world…"')).toBeTruthy();
    expect(loadVerseText).toHaveBeenCalledTimes(1);
  });

  it('shows the honest unavailable copy when the verse is missing there', async () => {
    const {getByText} = render(
      <AlsoInVersionsPanel
        {...baseProps}
        loadVerseText={jest.fn(async () => null)}
      />,
    );
    fireEvent.press(getByText('EN · WEB'));
    await flush();
    expect(getByText(/no está disponible en WEB/)).toBeTruthy();
  });

  it('fires the compare exit from the open peek', async () => {
    const onCompare = jest.fn();
    const {getByText} = render(
      <AlsoInVersionsPanel
        {...baseProps}
        onCompare={onCompare}
        loadVerseText={jest.fn(async () => 'text')}
      />,
    );
    fireEvent.press(getByText('EN · KJV'));
    await flush();
    fireEvent.press(getByText('Comparar versiones'));
    expect(onCompare).toHaveBeenCalledTimes(1);
  });

  it('fires onClose from the panel close button', () => {
    const onClose = jest.fn();
    const {getByLabelText} = render(
      <AlsoInVersionsPanel
        {...baseProps}
        onClose={onClose}
        loadVerseText={jest.fn(async () => null)}
      />,
    );
    fireEvent.press(getByLabelText('Cerrar ver también'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets the open peek when the selection (verseKey) moves', async () => {
    const {getByText, queryByText, rerender} = render(
      <AlsoInVersionsPanel
        {...baseProps}
        loadVerseText={jest.fn(async () => 'old verse text')}
      />,
    );
    fireEvent.press(getByText('EN · KJV'));
    await flush();
    expect(getByText('"old verse text"')).toBeTruthy();

    rerender(
      <AlsoInVersionsPanel
        {...baseProps}
        verseKey="43:3:17"
        loadVerseText={jest.fn(async () => 'new verse text')}
      />,
    );
    await flush();
    expect(queryByText('"old verse text"')).toBeNull();
  });
});
