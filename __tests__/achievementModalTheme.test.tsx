/**
 * Sprint 82/83 — the achievement-unlock celebration follows the SELECTED app
 * theme.
 *
 * S82 moved the card off a hard white surface onto useTheme. S83 made the
 * accent HYBRID: the big celebratory accents (border ring, icon halo, points,
 * button) follow the theme primary, and only a small tier badge keeps its own
 * hue as the rarity signal — the user read the all-tier-coloured S82 modal as
 * "not my theme" on the daily build. This pins that wiring so a refactor can't
 * silently revert to the static white card or re-tint everything with the tier.
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
  onPrimary: '#0f172a',
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

// Climb from a text node to the nearest ancestor that paints a background.
const bgOfNearestAncestor = (
  node: {props?: {style?: unknown}; parent?: unknown} | null,
): string | undefined => {
  let cur = node;
  while (cur) {
    const bg = (
      StyleSheet.flatten(cur.props?.style) as {backgroundColor?: string}
    )?.backgroundColor;
    if (bg) return bg;
    cur = cur.parent as typeof cur;
  }
  return undefined;
};

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

  it('uses the theme primary for the big accents (points + button ink)', () => {
    const t = translations.es;
    const {getByText} = render(
      <AchievementUnlockedModal
        visible
        achievement={achievement}
        onClose={jest.fn()}
      />,
    );
    // Points were the tier hue in S82; the hybrid moves them to the theme.
    const pointsText = `+${achievement.points} ${t.achievements.points}`;
    expect(colorOf(getByText(pointsText))).toBe(mockColors.primary);
    // The CTA ink is the locked onPrimary contrast colour (button bg = primary).
    expect(colorOf(getByText(t.achievements.awesome))).toBe(
      mockColors.onPrimary,
    );
  });

  it('keeps the small tier badge in its own tier hue (the rarity signal)', () => {
    const t = translations.es;
    const tierLabel = (t.achievements.tiers as Record<string, string>)[
      achievement.tier
    ].toUpperCase();
    const {getByText} = render(
      <AchievementUnlockedModal
        visible
        achievement={achievement}
        onClose={jest.fn()}
      />,
    );
    // The badge text sits inside the tier-coloured pill (an ancestor View).
    expect(bgOfNearestAncestor(getByText(tierLabel))).toBe(
      ACHIEVEMENT_TIER_COLORS[achievement.tier],
    );
  });
});
