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

export type FeatureGuideId =
  | 'memory'
  | 'originals'
  | 'versionComparison'
  | 'constellation'
  | 'audio'
  | 'achievements'
  | 'widgets'
  | 'together'
  | 'prepTable'
  | 'journeys'
  | 'devotionalBuilder'
  | 'propheticThread'
  | 'propheticMap';

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
  {
    id: 'constellation',
    listIcon: 'sparkles-outline',
    getLabel: t => t.constellation.guide.title,
    getDescription: t => t.constellation.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'sparkles',
      title: t.constellation.guide.title,
      intro: t.constellation.guide.intro,
      closeLabel: t.constellation.guide.close,
      sections: [
        {
          icon: 'eye-outline',
          title: t.constellation.guide.s1Title,
          body: t.constellation.guide.s1Body,
        },
        {
          icon: 'git-network-outline',
          title: t.constellation.guide.s2Title,
          body: t.constellation.guide.s2Body,
        },
        {
          icon: 'contract-outline',
          title: t.constellation.guide.s3Title,
          body: t.constellation.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'audio',
    listIcon: 'headset-outline',
    getLabel: t => t.audio.guide.title,
    getDescription: t => t.audio.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'headset',
      title: t.audio.guide.title,
      intro: t.audio.guide.intro,
      closeLabel: t.audio.guide.close,
      sections: [
        {
          icon: 'moon-outline',
          title: t.audio.guide.s1Title,
          body: t.audio.guide.s1Body,
        },
        {
          icon: 'color-wand-outline',
          title: t.audio.guide.s2Title,
          body: t.audio.guide.s2Body,
        },
        {
          icon: 'swap-horizontal-outline',
          title: t.audio.guide.s3Title,
          body: t.audio.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'achievements',
    listIcon: 'trophy-outline',
    getLabel: t => t.achievements.guide.title,
    getDescription: t => t.achievements.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'trophy',
      title: t.achievements.guide.title,
      intro: t.achievements.guide.intro,
      closeLabel: t.achievements.guide.close,
      sections: [
        {
          icon: 'medal-outline',
          title: t.achievements.guide.s1Title,
          body: t.achievements.guide.s1Body,
        },
        {
          icon: 'ribbon-outline',
          title: t.achievements.guide.s2Title,
          body: t.achievements.guide.s2Body,
        },
        {
          icon: 'share-outline',
          title: t.achievements.guide.s3Title,
          body: t.achievements.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'widgets',
    listIcon: 'apps-outline',
    getLabel: t => t.widgets.guide.title,
    getDescription: t => t.widgets.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'apps',
      title: t.widgets.guide.title,
      intro: t.widgets.guide.intro,
      closeLabel: t.widgets.guide.close,
      sections: [
        {
          icon: 'add-circle-outline',
          title: t.widgets.guide.s1Title,
          body: t.widgets.guide.s1Body,
        },
        {
          icon: 'calendar-outline',
          title: t.widgets.guide.s2Title,
          body: t.widgets.guide.s2Body,
        },
        {
          icon: 'logo-android',
          title: t.widgets.guide.s3Title,
          body: t.widgets.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'together',
    listIcon: 'people-outline',
    getLabel: t => t.together.guide.title,
    getDescription: t => t.together.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'people',
      title: t.together.guide.title,
      intro: t.together.guide.intro,
      closeLabel: t.together.guide.close,
      sections: [
        {
          icon: 'key-outline',
          title: t.together.guide.s1Title,
          body: t.together.guide.s1Body,
        },
        {
          icon: 'calendar-outline',
          title: t.together.guide.s2Title,
          body: t.together.guide.s2Body,
        },
        {
          icon: 'lock-closed-outline',
          title: t.together.guide.s3Title,
          body: t.together.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'prepTable',
    listIcon: 'reader-outline',
    getLabel: t => t.prepTable.guide.title,
    getDescription: t => t.prepTable.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'reader',
      title: t.prepTable.guide.title,
      intro: t.prepTable.guide.intro,
      closeLabel: t.prepTable.guide.close,
      sections: [
        {
          icon: 'time-outline',
          title: t.prepTable.guide.s1Title,
          body: t.prepTable.guide.s1Body,
        },
        {
          icon: 'albums-outline',
          title: t.prepTable.guide.s2Title,
          body: t.prepTable.guide.s2Body,
        },
        {
          icon: 'mic-outline',
          title: t.prepTable.guide.s3Title,
          body: t.prepTable.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'journeys',
    listIcon: 'map-outline',
    getLabel: t => t.journeys.guide.title,
    getDescription: t => t.journeys.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'map',
      title: t.journeys.guide.title,
      intro: t.journeys.guide.intro,
      closeLabel: t.journeys.guide.close,
      sections: [
        {
          icon: 'list-outline',
          title: t.journeys.guide.s1Title,
          body: t.journeys.guide.s1Body,
        },
        {
          icon: 'book-outline',
          title: t.journeys.guide.s2Title,
          body: t.journeys.guide.s2Body,
        },
        {
          icon: 'play-skip-forward',
          title: t.journeys.guide.s3Title,
          body: t.journeys.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'devotionalBuilder',
    listIcon: 'calendar-outline',
    getLabel: t => t.devotionalBuilder.guide.title,
    getDescription: t => t.devotionalBuilder.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'calendar',
      title: t.devotionalBuilder.guide.title,
      intro: t.devotionalBuilder.guide.intro,
      closeLabel: t.devotionalBuilder.guide.close,
      sections: [
        {
          icon: 'book-outline',
          title: t.devotionalBuilder.guide.s1Title,
          body: t.devotionalBuilder.guide.s1Body,
        },
        {
          icon: 'save-outline',
          title: t.devotionalBuilder.guide.s2Title,
          body: t.devotionalBuilder.guide.s2Body,
        },
        {
          icon: 'share-social-outline',
          title: t.devotionalBuilder.guide.s3Title,
          body: t.devotionalBuilder.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'propheticThread',
    listIcon: 'git-network-outline',
    getLabel: t => t.prophecies.guide.title,
    getDescription: t => t.prophecies.guide.rowDescription,
    getContent: t => ({
      headerIcon: 'git-network',
      title: t.prophecies.guide.title,
      intro: t.prophecies.guide.intro,
      closeLabel: t.prophecies.guide.close,
      sections: [
        {
          icon: 'arrow-forward-circle-outline',
          title: t.prophecies.guide.s1Title,
          body: t.prophecies.guide.s1Body,
        },
        {
          icon: 'filter-outline',
          title: t.prophecies.guide.s2Title,
          body: t.prophecies.guide.s2Body,
        },
        {
          icon: 'star-outline',
          title: t.prophecies.guide.s3Title,
          body: t.prophecies.guide.s3Body,
        },
      ],
    }),
  },
  {
    id: 'propheticMap',
    listIcon: 'link-outline',
    getLabel: t => t.prophecies.mapGuide.title,
    getDescription: t => t.prophecies.mapGuide.rowDescription,
    getContent: t => ({
      headerIcon: 'link',
      title: t.prophecies.mapGuide.title,
      intro: t.prophecies.mapGuide.intro,
      closeLabel: t.prophecies.mapGuide.close,
      sections: [
        {
          icon: 'hand-left-outline',
          title: t.prophecies.mapGuide.s1Title,
          body: t.prophecies.mapGuide.s1Body,
        },
        {
          icon: 'arrow-forward-circle-outline',
          title: t.prophecies.mapGuide.s2Title,
          body: t.prophecies.mapGuide.s2Body,
        },
        {
          icon: 'color-palette-outline',
          title: t.prophecies.mapGuide.s3Title,
          body: t.prophecies.mapGuide.s3Body,
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
