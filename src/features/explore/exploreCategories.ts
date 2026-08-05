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
 * semantically unrelated to "which category is this"). Every value here is
 * a mid-saturation Tailwind-500-family hue, matching the exact palette
 * `themes.ts` already draws from, so a reader who has seen the Temas screen
 * recognizes the same visual language here.
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
    accentColor: '#F59E0B', // amber-500 — sun/light
  },
  {
    id: 'themes',
    icon: 'grid',
    route: '/features/themes',
    section: 'popular',
    accentColor: '#6366F1', // indigo-500 — topical grid
  },
  {
    id: 'prophecies',
    icon: 'git-network',
    route: '/features/prophecies',
    section: 'popular',
    accentColor: '#8B5CF6', // violet-500 — the prophetic thread's own web
  },
  {
    id: 'bibleFacts',
    icon: 'bulb',
    route: '/features/facts',
    section: 'popular',
    accentColor: '#0EA5E9', // sky-500 — insight
  },
  {
    id: 'quiz',
    icon: 'help-circle',
    route: '/features/quiz',
    section: 'popular',
    accentColor: '#F97316', // orange-500 — energetic/competitive
  },
  {
    id: 'dictionary',
    icon: 'book',
    route: '/features/dictionary',
    section: 'popular',
    accentColor: '#3B82F6', // blue-500 — reference/book
  },
  // ---- "more" — the rest of the catalogue, this screen's own turf ----
  {
    id: 'journeys',
    icon: 'map',
    route: '/features/journeys',
    section: 'more',
    accentColor: '#10B981', // emerald-500 — routes/terrain
  },
  {
    id: 'kids',
    icon: 'happy',
    route: '/features/kids',
    section: 'more',
    accentColor: '#FACC15', // yellow-400 — playful
  },
  {
    id: 'sermonNotes',
    icon: 'create',
    route: '/features/sermon-notes',
    section: 'more',
    accentColor: '#14B8A6', // teal-500 — writing/organizing
  },
  {
    id: 'theology',
    icon: 'school',
    route: '/features/theology',
    section: 'more',
    accentColor: '#A855F7', // purple-500 — scholarly/deep study
  },
  {
    id: 'shareFaith',
    icon: 'heart',
    route: '/features/share-faith',
    section: 'more',
    accentColor: '#EF4444', // red-500 — heart/love
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
