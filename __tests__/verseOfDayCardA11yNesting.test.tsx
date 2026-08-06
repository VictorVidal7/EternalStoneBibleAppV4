/**
 * A11y audit fix — VerseOfDayCard's outer whole-card TouchableOpacity wraps
 * ~9 independently-actionable inner controls (history chevrons, "see it in…"
 * toggle, share, favorite, study/prep/Christ CTAs). `Touchable*`/`Pressable`
 * default `accessible` to `true`, which turns the WHOLE subtree into ONE
 * opaque accessibility node — on iOS VoiceOver this swallows every inner
 * control (unreachable individually). Confirmed live on Android via
 * `uiautomator dump` (see the component's own comment) that even where
 * TalkBack still reached the inner children, the outer wrapper itself
 * surfaced as a separate, UNLABELED "Button" stop (empty content-desc),
 * since it never carried its own `accessibilityLabel`.
 *
 * Also confirmed live: `accessible={false}` ALONE isn't enough on Android —
 * `TouchableOpacity` independently computes its own `focusable` prop
 * (defaults to `true` whenever `onPress` is set and it isn't `disabled`) and
 * forwards it to the same underlying view, and RN's Android `setFocusable`
 * ReactProp re-sets `view.isFocusable = true` regardless of what `accessible`
 * already set — undoing it. Both props are required together.
 *
 * This test pins the fix at the React-tree level (the actual native
 * accessibility-tree behavior was verified live via `uiautomator dump` on an
 * emulator, not repeatable in Jest): the outer wrapper opts out of being its
 * own accessibility/focus target, and the "read full chapter" action —
 * otherwise only reachable through that now-opted-out wrapper — stays
 * screen-reader-reachable through its own explicitly-labeled inner button,
 * matching every other CTA in this card (share, favorite, study, prep,
 * Christ note…) which already had explicit accessibilityRole+Label.
 */
import React from 'react';
import {TouchableOpacity} from 'react-native';
import {render, fireEvent} from '@testing-library/react-native';
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

const baseProps = {
  verseText: 'Jehová es mi fortaleza y mi escudo…',
  reference: 'Salmos 28:7',
  isDark: true,
};

const readFullChapterLabel = translations.es.home.readFullChapter;

describe('VerseOfDayCard — outer/inner touchable-nesting a11y fix', () => {
  it('opts the outer whole-card wrapper out of being its own accessibility/focus target', () => {
    const onPress = jest.fn();
    const {UNSAFE_getAllByType} = render(
      <VerseOfDayCard {...baseProps} onPress={onPress} />,
    );
    // The outermost TouchableOpacity in the tree IS the whole-card wrapper —
    // it renders (and is therefore found) before any of its nested children.
    const outerCardWrapper = UNSAFE_getAllByType(TouchableOpacity)[0];
    expect(outerCardWrapper.props.accessible).toBe(false);
    expect(outerCardWrapper.props.focusable).toBe(false);
  });

  it('gives the "read full chapter" CTA its own explicit role + label, matching every sibling CTA', () => {
    const onPress = jest.fn();
    const {getByLabelText} = render(
      <VerseOfDayCard {...baseProps} onPress={onPress} />,
    );
    const readButton = getByLabelText(readFullChapterLabel);
    expect(readButton.props.accessibilityRole).toBe('button');
    fireEvent.press(readButton);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps the whole card tappable for sighted/touch users despite the outer wrapper opting out of accessibility', () => {
    const onPress = jest.fn();
    const {UNSAFE_getAllByType} = render(
      <VerseOfDayCard {...baseProps} onPress={onPress} />,
    );
    const outerCardWrapper = UNSAFE_getAllByType(TouchableOpacity)[0];
    fireEvent.press(outerCardWrapper);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('every other footer/CTA control keeps its own pre-existing explicit accessibilityRole="button"', () => {
    // Regression guard: this fix must not have disturbed the wiring these
    // controls already had (see verseOfDayHistory.test.tsx /
    // verseOfDayAlternates.test.tsx for their own dedicated behavior tests).
    const {getByLabelText} = render(
      <VerseOfDayCard
        {...baseProps}
        onPress={jest.fn()}
        onShare={jest.fn()}
        onFavorite={jest.fn()}
      />,
    );
    expect(
      getByLabelText(translations.es.verse.shareVerse).props.accessibilityRole,
    ).toBe('button');
    expect(
      getByLabelText(translations.es.verse.addFavorite).props.accessibilityRole,
    ).toBe('button');
  });
});
