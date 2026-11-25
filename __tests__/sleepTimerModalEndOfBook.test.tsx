/**
 * R9-573 (S180) — the real SleepTimerModal hides "End of book" when told to
 * (MiniAudioPlayer does so while a verse playlist is loaded: a list has no
 * book of its own). Every other option stays, in both languages.
 */
import {render} from '@testing-library/react-native';
import {translations} from '../src/i18n/translations';

let mockLanguage: 'es' | 'en' = 'es';
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: require('../src/i18n/translations').translations[mockLanguage],
  }),
}));
jest.mock('../src/hooks/useTheme', () => {
  const colors = new Proxy({}, {get: () => '#123456'});
  return {useTheme: () => ({isDark: false, colors})};
});
jest.mock('@lib/haptics', () => ({
  haptics: new Proxy({}, {get: () => () => {}}),
}));

import {SleepTimerModal} from '../src/features/audio/components/SleepTimerModal';

const idle = {isActive: false, remainingMinutes: 0, endTime: null, mode: null};

function renderModal(showEndOfBook?: boolean) {
  return render(
    <SleepTimerModal
      visible
      onClose={jest.fn()}
      onSetTimer={jest.fn()}
      onSetEndOfChapter={jest.fn()}
      onSetEndOfBook={jest.fn()}
      onCancelTimer={jest.fn()}
      currentTimer={idle}
      {...(showEndOfBook === undefined ? {} : {showEndOfBook})}
    />,
  );
}

describe.each(['es', 'en'] as const)('SleepTimerModal (%s)', language => {
  const tSleep = translations[language].audio.sleepTimer;
  beforeEach(() => {
    mockLanguage = language;
  });

  it('by default (a chapter) offers both "End of chapter" and "End of book"', () => {
    const screen = renderModal();
    expect(screen.queryByText(tSleep.endOfChapterTitle)).toBeTruthy();
    expect(screen.queryByText(tSleep.endOfBookTitle)).toBeTruthy();
  });

  it('showEndOfBook={false} (a playlist) hides "End of book" and keeps "End of chapter"', () => {
    const screen = renderModal(false);
    expect(screen.queryByText(tSleep.endOfChapterTitle)).toBeTruthy();
    expect(screen.queryByText(tSleep.endOfBookTitle)).toBeNull();
    expect(screen.queryByText(tSleep.endOfBookSubtitle)).toBeNull();
  });
});
