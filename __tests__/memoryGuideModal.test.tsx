/**
 * Sprint 98 — MemoryGuideModal renders the explainer when visible.
 *
 * The deck/practice "?" opens this sheet so readers understand the boxes,
 * word-masking and self-grading. Lock that, when visible, it shows the three
 * section titles and the close action, and that it renders nothing while
 * hidden (so it never traps focus when closed).
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {MemoryGuideModal} from '../src/components/MemoryGuideModal';
import {translations} from '../src/i18n/translations';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

// The shared jest setup mocks useLanguage to Spanish.
const g = translations.es.memory.guide;

describe('MemoryGuideModal', () => {
  it('shows the three sections + close when visible', () => {
    const {getByText} = render(<MemoryGuideModal visible onClose={() => {}} />);
    expect(getByText(g.title)).toBeTruthy();
    expect(getByText(g.boxesTitle)).toBeTruthy();
    expect(getByText(g.maskTitle)).toBeTruthy();
    expect(getByText(g.gradeTitle)).toBeTruthy();
    expect(getByText(g.close)).toBeTruthy();
  });

  it('renders nothing while hidden', () => {
    const {queryByText} = render(
      <MemoryGuideModal visible={false} onClose={() => {}} />,
    );
    expect(queryByText(g.title)).toBeNull();
  });
});
