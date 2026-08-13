/**
 * Sprint 77 — VerseOfDayCard "see it in …" inline peek.
 *
 * Pins the component contract: chips render per alternate version, tapping
 * one lazily loads + quotes that translation inline (cached per version),
 * tapping again collapses, a missing verse shows the unavailable copy, and
 * the compare exit fires the callback.
 */
import {render, fireEvent, act} from '@testing-library/react-native';
import VerseOfDayCard from '../src/components/celestial/VerseOfDayCard';
import {translations} from '../src/i18n/translations';

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: true,
    colors: {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      info: '#0ea5e9',
      text: '#ffffff',
    },
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

const baseProps = {
  verseText: 'Porque de tal manera amó Dios al mundo…',
  reference: 'Juan 3:16',
  isDark: true,
  // The chips live behind the footer globe toggle, OFF by default; most of
  // these tests exercise the revealed state.
  alternatesVisible: true,
};

describe('VerseOfDayCard — see it in …', () => {
  it('renders one chip per alternate version', () => {
    const {getByText} = render(
      <VerseOfDayCard
        {...baseProps}
        alternates={[KJV, WEB]}
        loadAlternateText={jest.fn(async () => null)}
      />,
    );
    expect(getByText('EN · KJV')).toBeTruthy();
    expect(getByText('EN · WEB')).toBeTruthy();
  });

  it('hides the chip row without alternates or a loader', () => {
    const {queryByText, rerender} = render(<VerseOfDayCard {...baseProps} />);
    expect(queryByText('EN · KJV')).toBeNull();

    rerender(<VerseOfDayCard {...baseProps} alternates={[KJV]} />);
    expect(queryByText('EN · KJV')).toBeNull();
  });

  it('keeps the chips hidden until the globe toggle turns them on', () => {
    const onToggle = jest.fn();
    const {queryByText, getByLabelText} = render(
      <VerseOfDayCard
        {...baseProps}
        alternatesVisible={false}
        alternates={[KJV, WEB]}
        loadAlternateText={jest.fn(async () => null)}
        onToggleAlternates={onToggle}
      />,
    );
    // Default OFF: no chips, but the globe entry point is there.
    expect(queryByText('EN · KJV')).toBeNull();
    fireEvent.press(getByLabelText(translations.es.home.alsoToggle));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('collapses an open peek when the section is hidden again', async () => {
    const loader = jest.fn(async () => 'For God so loved the world…');
    const {getByText, findByText, queryByText, rerender} = render(
      <VerseOfDayCard
        {...baseProps}
        alternates={[KJV]}
        loadAlternateText={loader}
        onToggleAlternates={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByText('EN · KJV'));
    });
    expect(await findByText(/For God so loved the world/)).toBeTruthy();

    rerender(
      <VerseOfDayCard
        {...baseProps}
        alternatesVisible={false}
        alternates={[KJV]}
        loadAlternateText={loader}
        onToggleAlternates={jest.fn()}
      />,
    );
    expect(queryByText(/For God so loved the world/)).toBeNull();

    // Re-revealing starts from the clean chip row (no auto-reopened peek).
    rerender(
      <VerseOfDayCard
        {...baseProps}
        alternates={[KJV]}
        loadAlternateText={loader}
        onToggleAlternates={jest.fn()}
      />,
    );
    expect(getByText('EN · KJV')).toBeTruthy();
    expect(queryByText(/For God so loved the world/)).toBeNull();
  });

  it('loads and quotes the alternate text inline, caching per version', async () => {
    const loader = jest.fn(async () => 'For God so loved the world…');
    const {getByText, findByText, queryByText} = render(
      <VerseOfDayCard
        {...baseProps}
        alternates={[KJV, WEB]}
        loadAlternateText={loader}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('EN · KJV'));
    });
    expect(await findByText(/For God so loved the world/)).toBeTruthy();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith('KJV');

    // Collapse, reopen: cached — no second fetch.
    await act(async () => {
      fireEvent.press(getByText('EN · KJV'));
    });
    expect(queryByText(/For God so loved the world/)).toBeNull();

    await act(async () => {
      fireEvent.press(getByText('EN · KJV'));
    });
    expect(await findByText(/For God so loved the world/)).toBeTruthy();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('shows the unavailable copy when the verse is missing there', async () => {
    const loader = jest.fn(async () => null);
    const {getByText, findByText} = render(
      <VerseOfDayCard
        {...baseProps}
        alternates={[WEB]}
        loadAlternateText={loader}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('EN · WEB'));
    });
    const expected = translations.es.home.alsoUnavailable.replace(
      '{{version}}',
      'WEB',
    );
    expect(await findByText(expected)).toBeTruthy();
  });

  it('exposes the compare exit once a peek is open', async () => {
    const onCompare = jest.fn();
    const {getByText, findByText} = render(
      <VerseOfDayCard
        {...baseProps}
        alternates={[KJV]}
        loadAlternateText={jest.fn(async () => 'For God so loved…')}
        onCompare={onCompare}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('EN · KJV'));
    });
    const compare = await findByText(translations.es.home.alsoCompare);
    fireEvent.press(compare);
    expect(onCompare).toHaveBeenCalledTimes(1);
  });
});
