/**
 * ♿ AppText — a drop-in `<Text>` that caps OS font scaling per role.
 *
 * React Native's `<Text>` already honors the OS font-size setting
 * (`allowFontScaling` defaults to `true`), but UNCAPPED — so display numbers,
 * counters, badges and labels overflow their fixed boxes at large system
 * fonts. `AppText` injects a sane `maxFontSizeMultiplier` (from the shared
 * [[fontScale]] policy) so the text still grows with the user's preference,
 * just bounded enough to keep the layout intact.
 *
 * Usage: replace `<Text>` with `<AppText>` on numeric/display/compact chrome
 * and pass `scaleRole`:
 *   <AppText scaleRole="display">{stat}</AppText>   // headline numbers
 *   <AppText scaleRole="compact">{label}</AppText>  // pills / tab labels
 *   <AppText>{body}</AppText>                        // default moderate cap
 *
 * Reading/long-form text should stay as plain `<Text>` (or `scaleRole="body"`)
 * so it scales freely — accessibility first.
 *
 * A caller can still pass an explicit `maxFontSizeMultiplier` to override the
 * role default for a one-off.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {Text, TextProps} from 'react-native';
import {FontScaleRole, maxFontScaleFor} from '@lib/a11y/fontScale';

export interface AppTextProps extends TextProps {
  /**
   * Which font-scale cap to apply. Defaults to `'default'` (a moderate cap).
   * Use `'display'`/`'compact'` for fixed-box chrome, `'body'` for content
   * that should scale without a ceiling.
   */
  scaleRole?: FontScaleRole;
}

export const AppText: React.FC<AppTextProps> = ({
  scaleRole = 'default',
  maxFontSizeMultiplier,
  ...rest
}) => {
  return (
    <Text
      maxFontSizeMultiplier={
        maxFontSizeMultiplier ?? maxFontScaleFor(scaleRole)
      }
      {...rest}
    />
  );
};

export default AppText;
