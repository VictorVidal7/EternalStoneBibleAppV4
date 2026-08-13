/**
 * Sprint 92 — the Home "next milestone" nudge. Pins the honest gate (nothing
 * shown when no locked achievement is in progress) and that it surfaces the
 * single closest achievement with its name + progress count, bridging Home to
 * the Trophy tab.
 */
import {render} from '@testing-library/react-native';
import {NextMilestoneCard} from '../src/components/NextMilestoneCard';
import {translations} from '../src/i18n/translations';
import type {Achievement} from '../src/lib/achievements/types';
import {
  AchievementCategory,
  AchievementTier,
} from '../src/lib/achievements/types';

const mockColors = {
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  surfaceVariant: '#1e293b',
};

let mockAchievements: Achievement[];

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));
jest.mock('../src/context/ServicesContext', () => ({
  useServices: () => ({database: {}}),
}));
jest.mock('../src/hooks/useAchievements', () => ({
  useAchievements: () => ({
    achievements: mockAchievements,
    reload: jest.fn(),
  }),
}));
jest.mock('expo-router', () => ({
  // Invoke the focus callback synchronously so reload runs like on screen.
  useFocusEffect: (cb: () => void) => cb(),
}));

const ta = translations.es.achievements;

const make = (over: Partial<Achievement>): Achievement => ({
  id: 'verses_100',
  name: 'Cien versículos',
  description: 'Lee 100 versículos',
  icon: '📖',
  category: AchievementCategory.READING,
  requirement: 100,
  currentProgress: 0,
  isUnlocked: false,
  points: 50,
  tier: AchievementTier.BRONZE,
  ...over,
});

describe('NextMilestoneCard (Sprint 92)', () => {
  it('renders nothing when no locked achievement is in progress', () => {
    mockAchievements = [
      make({currentProgress: 0}), // not started → excluded
      make({id: 'x', isUnlocked: true, currentProgress: 100}), // already unlocked
    ];
    const {toJSON} = render(<NextMilestoneCard onPress={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('surfaces the closest milestone with its name and progress', () => {
    mockAchievements = [
      make({id: 'a', currentProgress: 20, requirement: 100}), // 20%
      make({id: 'b', name: 'Casi listo', currentProgress: 9, requirement: 10}), // 90% → closest
    ];
    const {getByText} = render(<NextMilestoneCard onPress={jest.fn()} />);
    expect(getByText(ta.nextMilestone)).toBeTruthy();
    expect(getByText('Casi listo')).toBeTruthy();
    expect(getByText('9 / 10')).toBeTruthy();
  });
});
