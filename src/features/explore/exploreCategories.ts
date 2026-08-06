/**
 * 🧭 exploreCategories — the pure catalogue backing "Explorar todo"
 * (`app/features/explore-all/index.tsx`).
 *
 * PURE (no React/RN, no DB, no i18n): each entry carries a stable `id`
 * (doubles as the i18n lookup key the screen uses to resolve its
 * title/subtitle, and the key persisted by [[exploreRecency]]'s
 * "last visited category" tracker), an Ionicons glyph name, the route it
 * opens, a curated grouping (`section`) for the screen's section headers,
 * and a per-category accent colour.
 *
 * `accentColor` follows the SAME per-item-hex-value precedent as
 * `src/features/study/themes.ts`'s `BibleTheme.accent` (NOT
 * `src/lib/achievements/rarityColors.ts` — that's a rarity/hierarchy system,
 * semantically unrelated to "which category is this"). Every value draws
 * from the same Tailwind palette `themes.ts` already uses, so a reader who
 * has seen the Temas screen recognizes the same visual language here — BUT
 * unlike `themes.ts` (whose accents only ever sit behind small icons/text on
 * `colors.card`), `ExploreFeaturedCard` puts the hero's own `accentColor` as
 * a full gradient stop directly UNDER large white bold text
 * (`app/features/themes/[theme].tsx`'s own `[accent, colors.primaryDark]`
 * header gradient does the same, but with much smaller header text). That
 * makes each accent's contrast against solid white load-bearing here in a
 * way it isn't elsewhere, so every value below was checked with
 * `src/lib/a11y/contrast.ts`'s `contrastRatio('#FFFFFF', accent)` and picked
 * (or, for 6 categories, deepened one Tailwind step from the "obvious" 500
 * shade) to clear WCAG AA large-text (≥3:1) — the hero title is 24px/800,
 * which qualifies. A plain 500-family pick would NOT have been safe for
 * amber/sky/orange/emerald/teal/yellow — each is annotated with its actual
 * ratio below.
 *
 * `section` mirrors the reasoning already documented in both Home
 * (`app/(tabs)/index.tsx`, "EXPLORAR (discover grid)") and this screen's own
 * header comment: 6 categories were curated onto Home's own grid because
 * they're "consulted most often"; the other 5 live ONLY here. That existing,
 * already-justified split is reused as this screen's two section groupings
 * rather than inventing a new taxonomy.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Section grouping for the dense list (see file header). */
export type ExploreSectionId = 'popular' | 'more';

export interface ExploreCategoryDef {
  /** Stable id — the i18n lookup key AND the recency-tracking storage value. */
  id: string;
  /** Ionicons glyph name (cast at the render site, same as `themes.ts`). */
  icon: string;
  /** Route this category's tile/hero navigates to. */
  route: string;
  /** Which section header this category is grouped under. */
  section: ExploreSectionId;
  /** Per-category accent hex (see file header for the palette precedent). */
  accentColor: string;
}

export const EXPLORE_CATEGORIES: readonly ExploreCategoryDef[] = [
  // ---- "popular" — the same 6 curated onto Home's own Explorar grid ----
  {
    id: 'dailyLight',
    icon: 'sunny',
    route: '/features/daily-light',
    section: 'popular',
    // amber-600 (deepened from 500's #F59E0B, which only clears 2.15:1 —
    // sun/light).  White-on-this: 3.19:1.
    accentColor: '#D97706',
  },
  {
    id: 'themes',
    icon: 'grid',
    route: '/features/themes',
    section: 'popular',
    // indigo-500 — topical grid. White-on-this: 4.47:1.
    accentColor: '#6366F1',
  },
  {
    id: 'prophecies',
    icon: 'git-network',
    route: '/features/prophecies',
    section: 'popular',
    // violet-500 — the prophetic thread's own web. White-on-this: 4.23:1.
    accentColor: '#8B5CF6',
  },
  {
    id: 'bibleFacts',
    icon: 'bulb',
    route: '/features/facts',
    section: 'popular',
    // sky-600 (deepened from 500's #0EA5E9, which only clears 2.77:1 —
    // insight). White-on-this: 4.10:1.
    accentColor: '#0284C7',
  },
  {
    id: 'quiz',
    icon: 'help-circle',
    route: '/features/quiz',
    section: 'popular',
    // orange-600 (deepened from 500's #F97316, which only clears 2.80:1 —
    // energetic/competitive). White-on-this: 3.56:1.
    accentColor: '#EA580C',
  },
  {
    id: 'dictionary',
    icon: 'book',
    route: '/features/dictionary',
    section: 'popular',
    // blue-500 — reference/book. White-on-this: 3.68:1.
    accentColor: '#3B82F6',
  },
  // ---- "more" — the rest of the catalogue, this screen's own turf ----
  {
    id: 'journeys',
    icon: 'map',
    route: '/features/journeys',
    section: 'more',
    // emerald-600 (deepened from 500's #10B981, which only clears 2.54:1 —
    // routes/terrain). White-on-this: 3.77:1.
    accentColor: '#059669',
  },
  {
    id: 'kids',
    icon: 'happy',
    route: '/features/kids',
    section: 'more',
    // pink-500 — playful (swapped from yellow-400 #FACC15, which cleared
    // only 1.53:1, the worst of the whole set by a wide margin — no
    // Tailwind yellow shade both reads as "yellow" and clears AA-large
    // against white). White-on-this: 3.53:1.
    accentColor: '#EC4899',
  },
  {
    id: 'sermonNotes',
    icon: 'create',
    route: '/features/sermon-notes',
    section: 'more',
    // teal-600 (deepened from 500's #14B8A6, which only clears 2.49:1 —
    // writing/organizing). White-on-this: 3.74:1.
    accentColor: '#0D9488',
  },
  {
    id: 'theology',
    icon: 'school',
    route: '/features/theology',
    section: 'more',
    // purple-500 — scholarly/deep study. White-on-this: 3.96:1.
    accentColor: '#A855F7',
  },
  {
    id: 'shareFaith',
    icon: 'heart',
    route: '/features/share-faith',
    section: 'more',
    // red-500 — heart/love. White-on-this: 3.76:1.
    accentColor: '#EF4444',
  },
];

/**
 * First-run / no-history fallback for the screen's featured category (see
 * [[exploreRecency]]'s `resolveFeaturedCategoryId`). Diccionario: a broadly
 * useful, always-relevant surface with no dependency on the reader having
 * done anything yet.
 */
export const DEFAULT_FEATURED_CATEGORY_ID = 'dictionary';

/** Every category id, in catalogue order. */
export function getExploreCategoryIds(): readonly string[] {
  return EXPLORE_CATEGORIES.map(c => c.id);
}

/** Look up a category by its `id`, or `null` when unknown (defensive). */
export function getExploreCategory(
  id: string | null | undefined,
): ExploreCategoryDef | null {
  if (!id) return null;
  return EXPLORE_CATEGORIES.find(c => c.id === id) ?? null;
}
