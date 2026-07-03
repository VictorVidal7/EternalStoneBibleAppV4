/**
 * 🧵 SHARE TEXTURES (pure) — T8.2, offering-unlocked
 *
 * A subtle pattern overlay for the share-image card, layered on top of
 * whichever `ShareTemplate` gradient is selected (see [[imageTemplates]]).
 * Textures are their own orthogonal control — a texture can be combined
 * with ANY template, free or premium — and every non-`none` texture is
 * exclusively premium (T8.2's approved scope: "new textured backgrounds …
 * as an alternative to flat gradients").
 *
 * No image assets: each texture is a small repeating SVG pattern (dots,
 * diagonal lines, an irregular grain scatter), rendered by the sibling
 * `ShareTextureOverlay` component at low opacity, tinted with the active
 * template's own `textColor` so it always reads as a quiet accent rather
 * than a competing graphic regardless of which template is active.
 *
 * Pure module — no React/React-Native imports, mirrors [[imageTemplates]].
 */

export type ShareTexture = 'none' | 'dots' | 'lines' | 'grain';

export const SHARE_TEXTURES: readonly ShareTexture[] = [
  'none',
  'dots',
  'lines',
  'grain',
];

/** Every texture except "none" (the default, no overlay) requires premium. */
export function isTextureUnlocked(
  texture: ShareTexture,
  isPremium: boolean,
): boolean {
  return texture === 'none' || isPremium;
}
