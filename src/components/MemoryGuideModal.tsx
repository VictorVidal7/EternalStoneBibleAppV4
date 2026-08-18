/**
 * 🧠 MemoryGuideModal — a short, gentle explainer for how the memorization
 * system works (Sprint 98).
 *
 * Readers asked "how does this work?" — the deck shows boxes, the practice
 * card hides words and asks you to grade yourself, but nothing said why.
 * Now a thin wrapper around the generalized `FeatureGuideModal` (see
 * `src/lib/onboarding/featureGuides.ts` for the `memory` registry entry
 * that supplies its three sections). Opened from a "?" on the deck and
 * practice screens.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {useLanguage} from '@hooks/useLanguage';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';

export interface MemoryGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MemoryGuideModal: React.FC<MemoryGuideModalProps> = ({
  visible,
  onClose,
}) => {
  const {t} = useLanguage();
  const content = getFeatureGuideContent('memory', t);

  return <FeatureGuideModal visible={visible} onClose={onClose} {...content} />;
};

export default MemoryGuideModal;
