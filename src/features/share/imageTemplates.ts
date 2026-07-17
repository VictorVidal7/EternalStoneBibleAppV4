/**
 * 🖼️ SHARE IMAGE TEMPLATES (pure)
 *
 * The catalog of verse-card backgrounds for `ImageShareModal`, plus the
 * social aspect-ratio presets. The 10 FREE templates are the ones shipped
 * since Sprint 3 — kept byte-identical so existing free users lose nothing.
 * The 9 PREMIUM templates are the "designer" set, gated behind
 * `usePremium()` (consistent with the S50–S53 device-local premium arc).
 *
 * T17 (deep-audit #22): 4 of the 9 premium templates (`graphite`,
 * `evergreen`, `blossom`, `champagne`) were repainted because they read as
 * near-twins of free templates or of each other — `evergreen` even shared
 * an exact hex stop with `boreal` and its exact gold text with `classic`.
 * Ids/tier are kept stable (only colors/textColor/icon changed) because
 * `stylePresets.ts` stores a user's saved look by `templateId` string.
 *
 * Pure module — no React/React-Native imports, so it is unit-tested in
 * isolation (mirror of `readerThemes.ts` / `scrubMath.ts`). Sprint 56.
 */

export type ShareTier = 'free' | 'premium';

/** Social aspect-ratio presets for the shared card (width : height). */
export type ShareAspect = 'square' | 'portrait' | 'story';

export interface ShareTemplate {
  /** Stable id (used as the React key and for a11y/regression tests). */
  id: string;
  /** LinearGradient stops — always ≥2 so it satisfies the gradient prop. */
  colors: readonly [string, string, ...string[]];
  /** Foreground (verse + brand) color, chosen for contrast over `colors`. */
  textColor: string;
  /** Ionicons glyph name for the watermark + swatch. */
  icon: string;
  tier: ShareTier;
}

/**
 * The 10 free templates (unchanged since Sprint 3) followed by the 9
 * premium "designer" gradients. Order matters: free first keeps the swatch
 * row stable for existing users, premium appended at the end.
 */
export const SHARE_TEMPLATES: readonly ShareTemplate[] = [
  // ── FREE (the original 10, byte-identical) ─────────────────────────────
  {
    id: 'classic',
    colors: ['#1A1D2E', '#2A2E45'],
    textColor: '#D4AF37',
    icon: 'book-outline',
    tier: 'free',
  },
  {
    id: 'sunrise',
    colors: ['#FF8C00', '#F27121'],
    textColor: '#FFFFFF',
    icon: 'sunny-outline',
    tier: 'free',
  },
  {
    id: 'nature',
    colors: ['#234D20', '#36802D'],
    textColor: '#FFFFFF',
    icon: 'leaf-outline',
    tier: 'free',
  },
  {
    id: 'spiritual',
    colors: ['#4E006E', '#8E24AA'],
    textColor: '#FFFFFF',
    icon: 'sparkles-outline',
    tier: 'free',
  },
  {
    id: 'ocean',
    colors: ['#0F2027', '#203A43', '#2C5364'],
    textColor: '#00D2FF',
    icon: 'water-outline',
    tier: 'free',
  },
  {
    id: 'royal',
    colors: ['#600000', '#C41E3A'],
    textColor: '#FFD700',
    icon: 'ribbon-outline',
    tier: 'free',
  },
  {
    id: 'midnight',
    colors: ['#000000', '#1C1C1C'],
    textColor: '#E0E0E0',
    icon: 'moon-outline',
    tier: 'free',
  },
  {
    id: 'minimal',
    colors: ['#FFFFFF', '#F5F5F7'],
    textColor: '#2C3E50',
    icon: 'document-text-outline',
    tier: 'free',
  },
  {
    id: 'aura',
    colors: ['#3A1C71', '#D76D77', '#FFAF7B'],
    textColor: '#FFFFFF',
    icon: 'color-palette-outline',
    tier: 'free',
  },
  {
    id: 'rose',
    colors: ['#F7CAC9', '#92A8D1'],
    textColor: '#5D4037',
    icon: 'heart-outline',
    tier: 'free',
  },
  // ── PREMIUM (new designer set) ─────────────────────────────────────────
  {
    id: 'cosmos',
    colors: ['#1A2980', '#26D0CE'],
    textColor: '#FFFFFF',
    icon: 'planet-outline',
    tier: 'premium',
  },
  {
    id: 'ember',
    colors: ['#3E0703', '#8B0000'],
    textColor: '#F5C04A',
    icon: 'flame-outline',
    tier: 'premium',
  },
  {
    id: 'velvet',
    colors: ['#5F2C82', '#49A09D'],
    textColor: '#FFFFFF',
    icon: 'wine-outline',
    tier: 'premium',
  },
  // T17 — repainted (deep-audit #22): was a pale pastel pink-peach
  // near-identical to free's rose. Now a saturated orchid-magenta jewel
  // tone, clearly heavier/richer than rose's soft pastel.
  {
    id: 'blossom',
    colors: ['#7A2560', '#C0459C'],
    textColor: '#FFFFFF',
    icon: 'flower-outline',
    tier: 'premium',
  },
  {
    id: 'noir',
    colors: ['#1F1C2C', '#928DAB'],
    textColor: '#E8C547',
    icon: 'sparkles-outline',
    tier: 'premium',
  },
  // T8.2 — a second premium wave, filling hue families the first 5 didn't
  // (cool teal/cyan, warm metallic neutral, cool monochrome, deep green).
  {
    id: 'boreal',
    colors: ['#0F2E3D', '#134E4A', '#5EEAD4'],
    textColor: '#FFFFFF',
    icon: 'prism-outline',
    tier: 'premium',
  },
  // T17 — repainted (deep-audit #22): was a pale beige near-identical to
  // free's rose/minimal. Now a muted metallic bronze-gold, distinct in
  // saturation from free's sunrise (same warm hue family, but sunrise is a
  // flat vivid orange while this stays a desaturated "brushed metal" gold).
  {
    id: 'champagne',
    colors: ['#5C4A1E', '#9C8244', '#D9C088'],
    textColor: '#241B08',
    icon: 'diamond-outline',
    tier: 'premium',
  },
  // T17 — repainted (deep-audit #22): was a flat near-black grey, reading
  // as a lighter twin of free's midnight. Now a genuine mid-tone cool
  // steel-blue-grey (never as dark as midnight, never as light as minimal).
  {
    id: 'graphite',
    colors: ['#2E333A', '#5A6270'],
    textColor: '#F0A860',
    icon: 'cube-outline',
    tier: 'premium',
  },
  // T17 — repainted (deep-audit #22): shared its exact gold text (D4AF37)
  // with free's classic and an exact hex stop (#134E4A) with boreal. Now a
  // deep, saturated emerald jewel-tone with a rose-gold accent instead.
  {
    id: 'evergreen',
    colors: ['#052E1C', '#1B7A4D'],
    textColor: '#E6B89C',
    icon: 'infinite-outline',
    tier: 'premium',
  },
];

/** Templates available without premium (the original 10). */
export const FREE_TEMPLATES: readonly ShareTemplate[] = SHARE_TEMPLATES.filter(
  t => t.tier === 'free',
);

/** Templates that require premium (the new designer set). */
export const PREMIUM_TEMPLATES: readonly ShareTemplate[] =
  SHARE_TEMPLATES.filter(t => t.tier === 'premium');

/**
 * A template is usable when it's free, or when the user has premium.
 * Selecting a locked premium template should route to the upsell instead.
 */
export function isTemplateUnlocked(
  template: ShareTemplate,
  isPremium: boolean,
): boolean {
  return template.tier === 'free' || isPremium;
}

/** Ordered list of the aspect presets shown in the modal. */
export const SHARE_ASPECTS: readonly ShareAspect[] = [
  'square',
  'portrait',
  'story',
];

/**
 * height = width × ratio. `square` is 1 so the default card stays exactly
 * the size it was before Sprint 56 (no visual regression for the default).
 */
export const ASPECT_RATIO: Record<ShareAspect, number> = {
  square: 1, // 1 : 1
  portrait: 5 / 4, // 4 : 5
  story: 16 / 9, // 9 : 16
};

/**
 * The card's pixel height for a given aspect and (already-known) width.
 * Defensive: a non-finite or non-positive width yields 0 so callers can
 * safely fall back to content height.
 */
export function aspectHeight(aspect: ShareAspect, width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return 0;
  }
  return Math.round(width * ASPECT_RATIO[aspect]);
}
