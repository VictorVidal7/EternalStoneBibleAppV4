/**
 * 📖 FEATURE GUIDES — central registry for `FeatureGuideModal` content.
 *
 * A THIRD layer alongside the first-run wizard (`useOnboarding`) and the
 * one-line contextual callouts (`contextualHints.ts`): a full explainer,
 * opened on demand from a "?" icon on the feature's own screen, for the
 * deep features a single sentence can't cover (idiomas originales, version
 * comparison, memorization…). See `contextualHints.ts`'s doc comment for
 * why this stays a static sheet, never a guided multi-step tour.
 *
 * Every guide's copy lives in i18n (`src/i18n/translations.ts`) — this file
 * only maps a stable `FeatureGuideId` to WHICH translation strings and
 * icons make up that guide's `FeatureGuideModal` props, as functions of `t`
 * rather than static values, since `t` is only known at render time (it
 * changes with the user's language setting). One registry entry powers
 * THREE call sites for the same guide: the feature screen's own "?" icon,
 * this guide's row in the Settings ▸ "Tips y guías" index
 * (`TipsAndGuidesSettings`), and — for `memory` — the existing
 * `MemoryGuideModal` wrapper. Adding a new guide means adding one entry
 * here plus its `guide` block in translations.ts; no call site needs to
 * duplicate section content.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {Ionicons} from '@expo/vector-icons';
import type {TranslationKeys} from '@/i18n/translations';
import type {FeatureGuideSection} from '@components/FeatureGuideModal';

export type FeatureGuideId = 'memory' | 'originals' | 'versionComparison';

export interface FeatureGuideContent {
  headerIcon?: keyof typeof Ionicons.glyphMap;
  title: string;
  intro: string;
  closeLabel: string;
  sections: FeatureGuideSection[];
}

export interface FeatureGuideDefinition {
  id: FeatureGuideId;
  /** Icon for this guide's row in the Settings index. */
  listIcon: keyof typeof Ionicons.glyphMap;
  /** Row title in the Settings index + the "?" button's a11y label. */
  getLabel: (t: TranslationKeys) => string;
  /** Row subtitle in the Settings index. */
  getDescription: (t: TranslationKeys) => string;
  /** Full `FeatureGuideModal` content (minus `visible`/`onClose`). */
  getContent: (t: TranslationKeys) => FeatureGuideContent;
}

export const FEATURE_GUIDES: readonly FeatureGuideDefinition[] = [
  {
    id: 'memory',
    listIcon: 'school-outline',
    getLabel: t => t.memory.guide.title,
    getDescription: t => t.memory.short,
    getContent: t => ({
      headerIcon: 'school',
      title: t.memory.guide.title,
      intro: t.memory.guide.intro,
      closeLabel: t.memory.guide.close,
      sections: [
        {
          icon: 'layers-outline',
          title: t.memory.guide.boxesTitle,
          body: t.memory.guide.boxesBody,
        },
        {
          icon: 'eye-off-outline',
          title: t.memory.guide.maskTitle,
          body: t.memory.guide.maskBody,
        },
        {
          icon: 'options-outline',
          title: t.memory.guide.gradeTitle,
          body: t.memory.guide.gradeBody,
        },
      ],
    }),
  },
  {
    id: 'originals',
    listIcon: 'language-outline',
    getLabel: t => t.originals.guide.title,
    getDescription: t => t.originals.subtitle,
    getContent: t => ({
      headerIcon: 'language',
      title: t.originals.guide.title,
      intro: t.originals.guide.intro,
      closeLabel: t.originals.guide.close,
      sections: [
        {
          icon: 'book-outline',
          title: t.originals.guide.wordsTitle,
          body: t.originals.guide.wordsBody,
        },
        {
          icon: 'search',
          title: t.originals.guide.lexiconTitle,
          body: t.originals.guide.lexiconBody,
        },
        {
          icon: 'grid-outline',
          title: t.originals.guide.interlinearTitle,
          body: t.originals.guide.interlinearBody,
        },
      ],
    }),
  },
  {
    id: 'versionComparison',
    listIcon: 'copy-outline',
    getLabel: t => t.versionComparison.guide.title,
    getDescription: t => t.versionComparison.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'copy',
      title: t.versionComparison.guide.title,
      intro: t.versionComparison.guide.intro,
      closeLabel: t.versionComparison.guide.close,
      sections: [
        {
          icon: 'copy-outline',
          title: t.versionComparison.guide.selectTitle,
          body: t.versionComparison.guide.selectBody,
        },
        {
          icon: 'options-outline',
          title: t.versionComparison.guide.contrastTitle,
          body: t.versionComparison.guide.contrastBody,
        },
        {
          icon: 'analytics',
          title: t.versionComparison.guide.analysisTitle,
          body: t.versionComparison.guide.analysisBody,
        },
      ],
    }),
  },
] as const;

export function getFeatureGuide(id: FeatureGuideId): FeatureGuideDefinition {
  // FEATURE_GUIDES always has exactly one entry per FeatureGuideId — the
  // union type IS the set of valid ids, so this can't miss.
  return FEATURE_GUIDES.find(g => g.id === id) as FeatureGuideDefinition;
}

export function getFeatureGuideContent(
  id: FeatureGuideId,
  t: TranslationKeys,
): FeatureGuideContent {
  return getFeatureGuide(id).getContent(t);
}
