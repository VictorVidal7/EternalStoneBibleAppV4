/**
 * Regression guard — CountUpText's DEFAULT formatter (no `format` prop passed)
 * must thread the app's CHOSEN language into `toLocaleString`, not silently
 * fall back to the device's system locale. Before the fix it called
 * `n.toLocaleString()` with no locale argument at all.
 *
 * `useReducedMotion` is mocked `true` so the count-up animation is skipped
 * and the final value renders on first paint (same trick as
 * achievementModalTheme.test.tsx), keeping this a synchronous render test.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {CountUpText} from '../src/components/ui/CountUpText';

jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

let mockLanguage: 'es' | 'en' = 'es';
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({language: mockLanguage}),
}));

describe('CountUpText default formatter (locale-aware)', () => {
  it('groups digits the Spanish way ("1.234.567") when the app language is es', () => {
    mockLanguage = 'es';
    const {getByText} = render(<CountUpText value={1234567} />);
    expect(getByText('1.234.567')).toBeTruthy();
  });

  it('groups digits the English way ("1,234,567") when the app language is en', () => {
    mockLanguage = 'en';
    const {getByText} = render(<CountUpText value={1234567} />);
    expect(getByText('1,234,567')).toBeTruthy();
  });

  it('still honors a caller-supplied format function untouched', () => {
    mockLanguage = 'en';
    const {getByText} = render(
      <CountUpText value={42} format={n => `#${n}`} />,
    );
    expect(getByText('#42')).toBeTruthy();
  });
});
