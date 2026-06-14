/**
 * Sprint 82 — the achievement-unlock celebration follows the SELECTED app theme.
 *
 * The modal used to be a hard white card with grey text (staticColors.white /
 * grayNeutral), which glared in dark mode regardless of the user's theme. It now
 * pulls its surface + text colours from useTheme, keeping the tier hue only as
 * the celebratory accent. This pins that wiring so a future refactor can't
 * silently revert to the static white card.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {AchievementUnlockedModal} from '../src/components/achievements/AchievementUnlockedModal';
import {getLocalizedAchievement} from '../src/lib/achievements/definitions';
import {
  AchievementTier,
  AchievementCategory,
  ACHIEVEMENT_TIER_COLORS,
} from '../src/lib/achievements/types';
import {translations} from '../src/i18n/translations';

const mockColors = {
  surface: '#111827',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  border: '#374151',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

// Reduced motion → the modal presents at rest (no Animated loops/confetti),
// which keeps the render deterministic in jsdom.
jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

const achievement = {
  id: 'first_search',
  name: 'Truth Seeker',
  description: 'Run your first search',
  icon: '🔍',
  category: AchievementCategory.READING,
  requirement: 1,
  currentProgress: 1,
  isUnlocked: true,
  points: 50,
  tier: AchievementTier.GOLD,
};

const colorOf = (node: {props: {style?: unknown}}): string | undefined =>
  (StyleSheet.flatten(node.props.style) as {color?: string})?.color;

describe('AchievementUnlockedModal theming (Sprint 82)', () => {
  it('paints its text with the active theme colours, not the old greys', () => {
    const t = translations.es;
    const localized = getLocalizedAchievement(achievement, t);
    const {getByText} = render(
      <AchievementUnlockedModal
        visible
        achievement={achievement}
        onClose={jest.fn()}
      />,
    );

    // Title + name follow the theme's primary text colour…
    expect(colorOf(getByText(t.achievements.unlockTitle))).toBe(
      mockColors.text,
    );
    expect(colorOf(getByText(localized.name))).toBe(mockColors.text);
    // …description + "points earned" label use the muted theme tiers.
    expect(colorOf(getByText(localized.description))).toBe(
      mockColors.textSecondary,
    );
    expect(colorOf(getByText(t.achievements.pointsEarned))).toBe(
      mockColors.textTertiary,
    );
  });

  it('keeps the tier hue as the points accent', () => {
    const t = translations.es;
    const {getByText} = render(
      <AchievementUnlockedModal
        visible
        achievement={achievement}
        onClose={jest.fn()}
      />,
    );
    const pointsText = `+${achievement.points} ${t.achievements.points}`;
    expect(colorOf(getByText(pointsText))).toBe(
      ACHIEVEMENT_TIER_COLORS[achievement.tier],
    );
  });
});
