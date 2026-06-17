/**
 * 📐 responsive — content-width caps for wide screens (Sprint 96).
 *
 * The app is a single-column phone layout. On a foldable's inner display
 * (~852dp wide), a tablet, or a phone in landscape, letting content stretch
 * edge-to-edge gives uncomfortably long reading lines and over-wide cards.
 * These caps constrain the content to a comfortable column and center it on
 * wide screens, while leaving phones untouched.
 *
 * The values are in dp (RN layout units), chosen ABOVE any phone's portrait
 * width (~490dp) so a `maxWidth` cap is a NO-OP on phones — the content is
 * already narrower than the cap, so it stays full-width as before. Only when
 * the viewport is wider than the cap does it constrain + center.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ViewStyle} from 'react-native';

/** Comfortable reading-column width — keeps verse line length sane. */
export const READER_MAX_WIDTH = 640;

/** General content cap (Home, lists, settings, plan detail…). */
export const CONTENT_MAX_WIDTH = 720;

/**
 * Style that caps a content block's width and centers it. A no-op on phones
 * (their width is below the cap), it constrains + centers on wider viewports.
 * Spread onto a content wrapper, or a ScrollView/FlatList contentContainerStyle.
 */
export function centeredMaxWidth(
  maxWidth: number = CONTENT_MAX_WIDTH,
): ViewStyle {
  return {width: '100%', maxWidth, alignSelf: 'center'};
}
