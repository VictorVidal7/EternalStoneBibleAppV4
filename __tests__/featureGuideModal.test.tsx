/**
 * FeatureGuideModal — the generalized "how does this work?" explainer
 * extracted from the memory-only `MemoryGuideModal` (Sprint 98) so any deep
 * feature can reuse it via `src/lib/onboarding/featureGuides.ts`. Lock
 * that, when visible, it renders the title, every section's title, and
 * the close action from whatever props it's given, and that it renders
 * nothing while hidden (so it never traps focus when closed).
 */

import {render} from '@testing-library/react-native';
import {FeatureGuideModal} from '../src/components/FeatureGuideModal';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const sampleProps = {
  title: 'Sample guide title',
  intro: 'Sample intro paragraph.',
  closeLabel: 'Got it',
  sections: [
    {icon: 'layers-outline' as const, title: 'Section one', body: 'Body one'},
    {icon: 'search' as const, title: 'Section two', body: 'Body two'},
  ],
};

describe('FeatureGuideModal', () => {
  it('shows the title, every section title, and close when visible', () => {
    const {getByText} = render(
      <FeatureGuideModal visible onClose={() => {}} {...sampleProps} />,
    );
    expect(getByText(sampleProps.title)).toBeTruthy();
    expect(getByText('Section one')).toBeTruthy();
    expect(getByText('Section two')).toBeTruthy();
    expect(getByText(sampleProps.closeLabel)).toBeTruthy();
  });

  it('renders nothing while hidden', () => {
    const {queryByText} = render(
      <FeatureGuideModal visible={false} onClose={() => {}} {...sampleProps} />,
    );
    expect(queryByText(sampleProps.title)).toBeNull();
  });
});
