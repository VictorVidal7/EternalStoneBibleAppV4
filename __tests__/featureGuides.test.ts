/**
 * featureGuides — the central registry that maps a `FeatureGuideId` to the
 * `FeatureGuideModal` content it supplies (see the module's own doc
 * comment for the full rationale). Pinned here:
 *  1. Every registered guide resolves real, non-empty content in BOTH
 *     shipped languages (es/en) — a guide that only renders empty strings
 *     in one language would be a silent regression.
 *  2. Every guide has exactly 3 sections (the format `FeatureGuideModal`
 *     was designed around), each with an icon, title and body.
 *  3. `getFeatureGuideContent` is equivalent to calling the registry entry
 *     directly — the convenience lookup doesn't drop or reorder anything.
 *  4. Guide ids are unique (no accidental duplicate registration).
 */
import {translations} from '../src/i18n/translations';
import {
  FEATURE_GUIDES,
  getFeatureGuide,
  getFeatureGuideContent,
  type FeatureGuideId,
} from '../src/lib/onboarding/featureGuides';

const LANGS = ['es', 'en'] as const;

describe('FEATURE_GUIDES registry', () => {
  it('has unique ids', () => {
    const ids = FEATURE_GUIDES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(FEATURE_GUIDES.map(g => g.id))(
    'guide "%s" resolves non-empty label/description/content in every language',
    (id: FeatureGuideId) => {
      const guide = getFeatureGuide(id);
      for (const lang of LANGS) {
        const t = translations[lang];
        expect(guide.getLabel(t).length).toBeGreaterThan(0);
        expect(guide.getDescription(t).length).toBeGreaterThan(0);

        const content = guide.getContent(t);
        expect(content.title.length).toBeGreaterThan(0);
        expect(content.intro.length).toBeGreaterThan(0);
        expect(content.closeLabel.length).toBeGreaterThan(0);
        expect(content.sections).toHaveLength(3);
        for (const section of content.sections) {
          expect(section.icon.length).toBeGreaterThan(0);
          expect(section.title.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it('getFeatureGuideContent matches calling the registry entry directly', () => {
    const t = translations.es;
    for (const guide of FEATURE_GUIDES) {
      expect(getFeatureGuideContent(guide.id, t)).toEqual(guide.getContent(t));
    }
  });
});
