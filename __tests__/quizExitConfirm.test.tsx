/**
 * Tanda I (item 2) — real-device feedback from Victor: the Bible Quiz screen
 * exited immediately on both hardware back and the header back arrow, with
 * ZERO warning, discarding all in-round progress (nothing is persisted until
 * `finishRoundSideEffects` runs on the LAST question). This regression-guards
 * the fix: a `ConfirmDialog` gates BOTH back paths, but ONLY once there's
 * something to lose — past question 1, before the round is complete
 * (`index > 0 && !roundComplete` in app/features/quiz/index.tsx).
 *
 * `QuizPanel` is mocked to a tiny test double (two buttons: answer + advance)
 * so the test drives round progress directly instead of depending on which
 * random question/options render — the thing under test is the screen's own
 * back-navigation gating, not QuizPanel's rendering.
 *
 * `react-native`'s BackHandler resolves to the iOS build under Jest
 * (`defaultPlatform: 'ios'` in react-native's own jest-preset), which is a
 * total no-op — it never stores the registered handler. `jest.spyOn` on the
 * imported `BackHandler.addEventListener` captures the handler function
 * directly, sidestepping that no-op without needing a deep module mock.
 */
import {render, fireEvent, act} from '@testing-library/react-native';
import {BackHandler} from 'react-native';
import QuizScreen from '../app/features/quiz/index';

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({back: mockBack, push: mockPush}),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
}));

jest.mock('@lib/a11y/focusTrap', () => ({
  focusTrapProps: () => ({}),
}));

const mockColors = {
  background: '#000000',
  surface: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  error: '#ef4444',
  onPrimary: '#ffffff',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, gradient: undefined, isDark: false}),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

jest.mock('@hooks/useContentBottomInset', () => ({
  useContentBottomInset: () => 0,
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));

jest.mock('@context/PremiumContext', () => ({
  usePremium: () => ({isPremium: false}),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({
    hasCard: () => false,
    addCard: jest.fn(),
    reviewCard: jest.fn(),
  }),
}));

jest.mock('@/hooks/useQuizStats', () => ({
  useQuizStats: () => ({
    loaded: true,
    stats: {},
    summary: {},
    recordRoundResult: jest.fn(),
  }),
}));

// A minimal stand-in: two labeled buttons drive `onAnswer`/`onAdvance`
// directly, independent of which random question/options the real
// QuizPanel would render. Built with `React.createElement` rather than JSX —
// JSX inside a `jest.mock` factory breaks `babel-plugin-jest-hoist` in this
// repo's babel config (every existing component mock in this suite avoids
// it too, e.g. `Ionicons: () => null` instead of `() => <Icon />`).
jest.mock('@/components/quiz/QuizPanel', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    QuizPanel: ({
      onAnswer,
      onAdvance,
    }: {
      onAnswer: (correct: boolean) => void;
      onAdvance: () => void;
    }) =>
      R.createElement(
        R.Fragment,
        null,
        R.createElement(
          RN.TouchableOpacity,
          {
            accessibilityRole: 'button',
            accessibilityLabel: 'test-answer',
            onPress: () => onAnswer(true),
          },
          R.createElement(RN.Text, null, 'test-answer'),
        ),
        R.createElement(
          RN.TouchableOpacity,
          {
            accessibilityRole: 'button',
            accessibilityLabel: 'test-advance',
            onPress: () => onAdvance(),
          },
          R.createElement(RN.Text, null, 'test-advance'),
        ),
      ),
  };
});

const es = require('../src/i18n/translations').translations.es;
const tq = es.quiz;
const backLabel = es.bible.back;
const cancelLabel = es.cancel;

function renderScreen() {
  return render(<QuizScreen />);
}

/** Answers + advances past question 1, landing on question 2 (index 1, round not complete). */
function advancePastFirstQuestion(utils: ReturnType<typeof renderScreen>) {
  fireEvent.press(utils.getByLabelText('test-answer'));
  fireEvent.press(utils.getByLabelText('test-advance'));
}

describe('Quiz screen — exit confirmation mid-round', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
  });

  it('exits immediately on hardware back when nothing has been answered yet (question 1)', () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    const utils = renderScreen();

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    expect(consumed).toBe(false);
    expect(utils.queryByText(tq.exitConfirmTitle)).toBeNull();
    // `false` lets the default route-pop proceed — this screen doesn't call
    // router.back() itself in that case, the navigator's default pop does.
    expect(mockBack).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });

  it('shows the exit-confirm dialog on hardware back mid-round instead of exiting', () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    const utils = renderScreen();
    advancePastFirstQuestion(utils);

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    // `true` consumes the event — the screen, not the navigator, decides.
    expect(consumed).toBe(true);
    expect(utils.getByText(tq.exitConfirmTitle)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();

    // Confirming actually exits.
    fireEvent.press(utils.getByText(tq.exitConfirmCta));
    expect(mockBack).toHaveBeenCalledTimes(1);

    addEventListenerSpy.mockRestore();
  });

  it('cancelling the dialog keeps the round going (no navigation)', () => {
    const addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
    const utils = renderScreen();
    advancePastFirstQuestion(utils);

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    act(() => {
      handler();
    });
    expect(utils.getByText(tq.exitConfirmTitle)).toBeTruthy();

    fireEvent.press(utils.getByText(cancelLabel));
    expect(mockBack).not.toHaveBeenCalled();
    expect(utils.queryByText(tq.exitConfirmTitle)).toBeNull();

    addEventListenerSpy.mockRestore();
  });

  it('the header back arrow exits immediately on question 1 (nothing to lose)', () => {
    const utils = renderScreen();
    fireEvent.press(utils.getByLabelText(backLabel));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(utils.queryByText(tq.exitConfirmTitle)).toBeNull();
  });

  it('the header back arrow shows the confirm dialog mid-round instead of exiting', () => {
    const utils = renderScreen();
    advancePastFirstQuestion(utils);

    fireEvent.press(utils.getByLabelText(backLabel));
    expect(mockBack).not.toHaveBeenCalled();
    expect(utils.getByText(tq.exitConfirmTitle)).toBeTruthy();

    fireEvent.press(utils.getByText(tq.exitConfirmCta));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
