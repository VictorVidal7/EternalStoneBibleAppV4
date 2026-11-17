/**
 * R9-30, tanda 1 — four device-local keys: prophecy favorites, prophecy
 * progress, quiz stats and kids progress.
 *
 * The rule for a key to travel in `payload.local`: nothing mounted may hold
 * the whole value in memory and write it back over a restored one while the
 * app stays open. These stores read the disk inside every write, so a restore
 * written behind their back survives the next write. These cases pin that:
 * each one writes once through the store (or loads the hook), then writes the
 * "restored" value straight to the disk, then writes once more through it.
 * Each case was seen to fail with the store mutated to write from a memory
 * copy (S161).
 *
 * Lo REAL: the four stores, `useQuizStats`. Lo sustituido: AsyncStorage (the
 * jest mock), `useFocusEffect` (a mount effect).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, renderHook, waitFor} from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));

import {
  getFavoriteProphecies,
  toggleProphecyFavorite,
} from '../src/features/study/prophecyFavorites';
import {
  getVisitedProphecies,
  markPropheciesVisited,
} from '../src/features/study/prophecyProgress';
import {
  QUIZ_STATS_KEY,
  parseQuizStats,
  type QuizRoundResult,
} from '../src/features/quiz/quizStatsStore';
import {useQuizStats} from '../src/hooks/useQuizStats';
import {
  getKidsProgress,
  markKidsSceneSeen,
  markKidsStoryCompleted,
  recordKidsQuizScore,
} from '../src/features/kids/kidsProgress';

const ROUND: QuizRoundResult = {
  score: 1,
  total: 1,
  perQuestionResults: [{type: 'who-said-it', correct: true}],
  timedMode: false,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('R9-30 — a restored value survives the next write', () => {
  it('prophecy favorites: the toggle reads the disk, not the screen state', async () => {
    await toggleProphecyFavorite('old');
    expect([...(await getFavoriteProphecies())]).toEqual(['old']);
    // The restore, behind the screen's back.
    await AsyncStorage.setItem('@prophecy_favorites_v1', '["r1","r2"]');
    await toggleProphecyFavorite('new');
    const raw = await AsyncStorage.getItem('@prophecy_favorites_v1');
    expect(JSON.parse(raw!).sort()).toEqual(['new', 'r1', 'r2']);
  });

  it('prophecy progress: marking a visit reads the disk', async () => {
    await markPropheciesVisited('old');
    expect([...(await getVisitedProphecies())]).toEqual(['old']);
    await AsyncStorage.setItem('@prophecy_progress_v1', '["r1"]');
    await markPropheciesVisited('new');
    const raw = await AsyncStorage.getItem('@prophecy_progress_v1');
    expect(JSON.parse(raw!).sort()).toEqual(['new', 'r1']);
  });

  it('quiz stats: the mounted hook folds a round into the disk, not its copy', async () => {
    const {result} = renderHook(() => useQuizStats());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.stats.roundsPlayed).toBe(0);
    // The restore: 7 rounds, 7 answered, while the hook holds 0.
    const restored = parseQuizStats(null);
    restored.roundsPlayed = 7;
    restored.questionsAnswered = 7;
    restored.correctAnswers = 5;
    await AsyncStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(restored));
    await act(async () => {
      await result.current.recordRoundResult(ROUND);
    });
    const onDisk = parseQuizStats(await AsyncStorage.getItem(QUIZ_STATS_KEY));
    expect(onDisk.roundsPlayed).toBe(8);
    expect(onDisk.questionsAnswered).toBe(8);
    expect(result.current.stats.roundsPlayed).toBe(8);
  });

  it('kids progress: each of the three writers reads the disk', async () => {
    await markKidsStoryCompleted('old');
    expect((await getKidsProgress()).storiesCompleted).toEqual(['old']);
    const restored = {
      default: {
        storiesCompleted: ['r1'],
        scenesSeen: {r1: 4},
        quizBest: {r1: 3},
        planStartedAt: '2026-01-01T00:00:00.000Z',
      },
    };
    await AsyncStorage.setItem('@kids_progress_v1', JSON.stringify(restored));
    await markKidsSceneSeen('new', 1);
    await recordKidsQuizScore('new', 2);
    const after = await markKidsStoryCompleted('new');
    expect(after).toEqual({
      storiesCompleted: ['r1', 'new'],
      scenesSeen: {r1: 4, new: 1},
      quizBest: {r1: 3, new: 2},
      planStartedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
